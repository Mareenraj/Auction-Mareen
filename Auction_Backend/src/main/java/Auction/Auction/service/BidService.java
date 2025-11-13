package Auction.Auction.service;

import Auction.Auction.dto.BidResponse;
import Auction.Auction.entity.*;
import Auction.Auction.exception.*;
import Auction.Auction.repository.*;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BidService {
    private final BidRepository bidRepository;

    private final PlayerRepository playerRepository;

    private final TeamRepository teamRepository;

    private final SimpMessagingTemplate messagingTemplate;

    private final AuctionWheelService wheelService;

    private final PlayerAllocationRepository allocationRepository;

    private final AuctionRepository auctionRepository;

    private final UserRepository userRepository;

    private final AuctionTimerService auctionTimerService;

    private final PlayerAllocationRepository playerAllocationRepository;

    private int currentRound = 0;

    public BidService(BidRepository bidRepository, PlayerRepository playerRepository, TeamRepository teamRepository, SimpMessagingTemplate messagingTemplate, AuctionWheelService wheelService, PlayerAllocationRepository allocationRepository, AuctionRepository auctionRepository, UserRepository userRepository, AuctionTimerService auctionTimerService, PlayerAllocationRepository playerAllocationRepository) {
        this.bidRepository = bidRepository;
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
        this.messagingTemplate = messagingTemplate;
        this.wheelService = wheelService;
        this.allocationRepository = allocationRepository;
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
        this.auctionTimerService = auctionTimerService;
        this.playerAllocationRepository = playerAllocationRepository;
    }

    public List<Bid> findAll() {
        return bidRepository.findAll();
    }

    public Optional<Bid> findById(Long id) {
        return bidRepository.findById(id);
    }

    public Bid save(Bid bid) {
        // Validate player and team
        Player player = playerRepository.findById(bid.getPlayer().getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));
        Team team = teamRepository.findById(bid.getTeam().getId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
        if (team.getCurrentTotalPoints() < bid.getBidAmount() || player.isSold()) {
            throw new RuntimeException("Invalid bid: Insufficient budget or player already sold");
        }

        Bid savedBid = bidRepository.save(bid);

        // Broadcast the new bid via WebSocket
        messagingTemplate.convertAndSend("/topic/bids", savedBid);

        return savedBid;
    }

    public Bid update(Long id, Bid updatedBid) {
        Optional<Bid> existingBid = bidRepository.findById(id);
        if (existingBid.isPresent()) {
            Bid bid = existingBid.get();
            // Validate updated player and team
            Player player = playerRepository.findById(updatedBid.getPlayer().getId())
                    .orElseThrow(() -> new RuntimeException("Player not found"));
            Team team = teamRepository.findById(updatedBid.getTeam().getId())
                    .orElseThrow(() -> new RuntimeException("Team not found"));
            if (team.getCurrentTotalPoints() < updatedBid.getBidAmount() || player.isSold()) {
                throw new RuntimeException("Invalid bid update: Insufficient budget or player already sold");
            }
            bid.setPlayer(updatedBid.getPlayer());
            bid.setTeam(updatedBid.getTeam());
            bid.setBidAmount(updatedBid.getBidAmount());
            bid.setTimestamp(updatedBid.getTimestamp());
            Bid savedBid = bidRepository.save(bid);
            // Broadcast updated bid
            messagingTemplate.convertAndSend("/topic/bids", savedBid);
            return savedBid;
        } else {
            throw new RuntimeException("Bid not found with id: " + id);
        }
    }

    public void delete(Long id) {
        bidRepository.deleteById(id);
    }

    // ---------------- Bidding ----------------

    public Bid placeBid(Long playerId, Long teamId, double amount) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (team.getCurrentTotalPoints() < amount) {
            throw new RuntimeException("Invalid bid: Insufficient budget");
        }
        if (player.isSold()) {
            throw new RuntimeException("Invalid bid: Player already sold");
        }

        Bid bid = new Bid();
        bid.setPlayer(player);
        bid.setTeam(team);
        bid.setBidAmount(amount);
        bid.setTimestamp(LocalDateTime.now());

        Bid savedBid = bidRepository.save(bid);

        //  Broadcast bid to all connected clients
        messagingTemplate.convertAndSend("/topic/bids", savedBid);

        return savedBid;
    }

    // ---------------- Allocation ----------------

    public void allocatePlayer(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        if (player.isSold()) {
            return; // Already sold
        }

        List<Bid> bids = bidRepository.findByPlayer(player);
        if (bids.isEmpty()) {
            return; // No bids placed
        }

        // Find the highest bid
        Bid highestBid = bids.stream()
                .max((b1, b2) -> Double.compare(b1.getBidAmount(), b2.getBidAmount()))
                .get();

        Team winningTeam = highestBid.getTeam();
        double finalPrice = highestBid.getBidAmount();

        // Deduct budget
        winningTeam.setCurrentTotalPoints(winningTeam.getCurrentTotalPoints() - finalPrice);
        teamRepository.save(winningTeam);

        // Save allocation
        PlayerAllocation allocation = new PlayerAllocation();
        allocation.setPlayer(player);
        allocation.setTeam(winningTeam);
        allocation.setFinalPrice(finalPrice);
        allocationRepository.save(allocation);

        // Mark player as sold
        player.setSold(true);
        playerRepository.save(player);

        //  Broadcast allocation
        messagingTemplate.convertAndSend("/topic/allocations", allocation);

        // Move to next round
        currentRound++;
        wheelService.startNewRound();
    }

    // ---------------- Wheel Selection ----------------

    public Player startWheelSelection() {
        Player selectedPlayer = wheelService.selectNextPlayer(currentRound + 1);

        if (selectedPlayer != null) {
            //  Broadcast new selected player
            messagingTemplate.convertAndSend("/topic/current-player", selectedPlayer);
        }

        return selectedPlayer;
    }

    public List<Player> getAvailablePlayersForWheel() {
        return wheelService.getAvailablePlayers(currentRound + 1);
    }

    @Transactional
    public BidResponse saveBid(Long auctionId, Long playerId, Long userId) {
        Optional<Auction> optionalAuction = auctionRepository.findById(auctionId);
        Optional<Player> optionalPlayer = playerRepository.findById(playerId);
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            throw new UserNotFoundException("User not found.");
        }
        if (optionalUser.get().getRole() != Role.TEAM_OWNER) {
            throw new UserNotTeamOwnerException("Only TEAM_OWNER can place bids");
        }
        User teamOwner = optionalUser.get();

        if (optionalAuction.isEmpty()) {
            throw new AuctionNotFoundException("Auction not found.");
        }
        if (!optionalAuction.get().getStatus().toString().equals("LIVE")) {
            throw new AuctionIsNotLiveException("This auction is not live.");
        }
        Auction auction = optionalAuction.get();

        if (optionalPlayer.isEmpty()) {
            throw new PlayerNotFoundException("Player not found.");
        }
        if (optionalPlayer.get().isSold()) {
            throw new PlayerAlreadySoldException("This player is already sold.");
        }
        if (!optionalPlayer.get().getPlayerStatus().toString().equals("AVAILABLE")) {
            throw new PlayerNotAvailableException("This player is not available.");
        }
        Player player = optionalPlayer.get();

        Team team = teamRepository.findByOwnerAndAuctionIs(teamOwner, auction)
                .orElseThrow(() -> new TeamOwnerAndAuctionException(
                        "No team found for this team owner in the specified auction."));

        double currentBidAmount = (player.getCurrentBidAmount() == null || player.getCurrentBidAmount() == 0.0)
                ? auction.getMinimumBid()
                : player.getCurrentBidAmount() + auction.getBidIncreaseBy();

        if (team.getCurrentMaxAllowedPointsPerPlayer() < currentBidAmount) {
            throw new PlayerBidLimitException("Cannot place bid: maximum points allowed per player has been exceeded. Max: " + team.getCurrentMaxAllowedPointsPerPlayer());
        }

        player.setCurrentBidAmount(currentBidAmount);
        player.setCurrentBidTeam(team);
        playerRepository.save(player);

        Bid bid = new Bid();
        bid.setPlayer(player);
        bid.setTeam(team);
        bid.setBidAmount(currentBidAmount);
        bid.setTimestamp(LocalDateTime.now());
        bidRepository.save(bid);

        boolean timerStarted = auctionTimerService.startOrResetTimerForPlayerAllocation(playerId, team.getId());
        if (!timerStarted) {
            throw new RuntimeException("Failed to start timer for playerId: " + playerId);
        }

        return new BidResponse(currentBidAmount, team.getName());
    }

    @EventListener
    @Transactional
    public void handlePlayerAllocationTimeout(AuctionTimerService.PlayerAllocationTimeoutEvent event) {
        Long playerId = event.playerId();
        Long teamId = event.teamId();

        log.info("Handling timeout for playerId: {} and teamId: {}", playerId, teamId);

        Optional<Player> optionalPlayer = playerRepository.findById(playerId);
        Optional<Team> optionalTeam = teamRepository.findById(teamId);
        Optional<Auction> optionalAuction = optionalTeam.flatMap(team -> auctionRepository.findById(team.getAuction().getId()));

        if (optionalPlayer.isEmpty() || optionalTeam.isEmpty() || optionalAuction.isEmpty()) {
            log.error("Player, team, or auction not found for playerId: {}, teamId: {}", playerId, teamId);
            return;
        }

        Player player = optionalPlayer.get();
        Team team = optionalTeam.get();
        Auction auction = optionalAuction.get();

        double currentBidAmount = player.getCurrentBidAmount() == null ? 0.0 : player.getCurrentBidAmount();
        if (currentBidAmount <= auction.getMinimumBid()) {
            player.setPlayerStatus(PlayerStatus.UNSOLD);
            playerRepository.save(player);
            messagingTemplate.convertAndSend(
                    "/topic/auction/" + auction.getId() + "/player/" + playerId,
                    new BidResponse(0.0, null));
            return;
        }

        double currentTotalPoints = team.getCurrentTotalPoints() - currentBidAmount;
        int currentPlayerCount = team.getCurrentPlayerCount() + 1;
        int totalPlayerCountPerTeam = auction.getPlayerPerTeam();
        double minimumBid = auction.getMinimumBid();
        double bidIncreaseBy = auction.getBidIncreaseBy();
        double currentMaxAllowedPointsPerPlayer = currentTotalPoints -
                ((minimumBid + bidIncreaseBy) * (totalPlayerCountPerTeam - currentPlayerCount - 1));

        team.setCurrentTotalPoints(currentTotalPoints);
        team.setCurrentPlayerCount(currentPlayerCount);
        team.setCurrentMaxAllowedPointsPerPlayer(currentMaxAllowedPointsPerPlayer);
        teamRepository.save(team);

        PlayerAllocation playerAllocation = new PlayerAllocation();
        playerAllocation.setPlayer(player);
        playerAllocation.setTeam(team);
        playerAllocation.setFinalPrice(currentBidAmount);
        playerAllocationRepository.save(playerAllocation);

        player.setSold(true);
        player.setPlayerStatus(PlayerStatus.SOLD);
        playerRepository.save(player);

        messagingTemplate.convertAndSend(
                "/topic/auction/" + auction.getId() + "/player/" + playerId,
                new BidResponse(currentBidAmount, team.getName()));
    }
}