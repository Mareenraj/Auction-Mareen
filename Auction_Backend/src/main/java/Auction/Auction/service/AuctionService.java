package Auction.Auction.service;

import Auction.Auction.dto.AuctionRequest;
import Auction.Auction.dto.AuctionResponse;
import Auction.Auction.entity.*;
import Auction.Auction.exception.AuctionDuplicationException;
import Auction.Auction.exception.AuctionNotFoundException;
import Auction.Auction.exception.CantAddAuctionException;
import Auction.Auction.exception.UserNotFoundException;
import Auction.Auction.mapper.AuctionMapper;
import Auction.Auction.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AuctionService {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;

    private final AuctionRepository auctionRepository;

    private final BidRepository bidRepository;

    private final PlayerAllocationRepository allocationRepository;

    private final AuctionMapper auctionMapper;

    private final UserRepository userRepository;

    public AuctionService(PlayerRepository playerRepository, TeamRepository teamRepository, AuctionRepository auctionRepository, BidRepository bidRepository, PlayerAllocationRepository allocationRepository, AuctionMapper auctionMapper, UserRepository userRepository) {
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
        this.auctionRepository = auctionRepository;
        this.bidRepository = bidRepository;
        this.allocationRepository = allocationRepository;
        this.auctionMapper = auctionMapper;
        this.userRepository = userRepository;
    }


    public List<AuctionResponse> findAll() {
        List<Auction> auctionList = auctionRepository.findAll();
        return auctionMapper.mapToAuctionResponseList(auctionList);
    }


    public AuctionResponse getAuctionById(Long id) {
        Auction auction = auctionRepository.findById(id).orElseThrow(() -> new AuctionNotFoundException("Auction not found."));
        return auctionMapper.mapToAuctionResponse(auction);
    }

    @Transactional
    public AuctionResponse save(AuctionRequest auctionRequest, byte[] imageBytes) throws CantAddAuctionException {

        Optional<User> optionalAdmin = userRepository.findById(auctionRequest.adminId());
        if (optionalAdmin.isEmpty()) {
            throw new UserNotFoundException("User not found!");
        }

//        if (!optionalAdmin.get().getRole().toString().equals("ADMIN")) {
//            throw new UserNotAdminException("This user not ADMIN!");
//        }
        User admin = optionalAdmin.get();


        Auction auction = auctionMapper.mapToEntity(auctionRequest, admin, imageBytes);

        if (auction.getAuctionName() != null) {
            boolean exists = auctionRepository.existsByAuctionNameAndAdminIdAndIdNot(
                    auction.getAuctionName(),
                    auction.getAdmin().getId(),
                    auction.getId()
            );

            if (exists) {
                throw new AuctionDuplicationException(
                        "Auction with name '" + auction.getAuctionName() + "' already exists for this admin"
                );
            }
        }

        Auction saved = auctionRepository.save(auction);
        return auctionMapper.mapToAuctionResponse(saved);

    }


    @Transactional
    public AuctionResponse update(Long id, AuctionRequest auctionRequest, byte[] imageBytes) {
        Auction existingAuction = auctionRepository.findById(id)
                .orElseThrow(() -> new AuctionNotFoundException("Auction not found with id: " + id));

        if (auctionRequest.auctionName() != null && !auctionRequest.auctionName().isBlank()) {
            existingAuction.setAuctionName(auctionRequest.auctionName());
        }
        if (auctionRequest.playerPerTeam() != null && auctionRequest.playerPerTeam() > 0) {
            existingAuction.setPlayerPerTeam(auctionRequest.playerPerTeam());
        }
        if (auctionRequest.bidIncreaseBy() != null && auctionRequest.bidIncreaseBy() > 0) {
            existingAuction.setBidIncreaseBy(auctionRequest.bidIncreaseBy());
        }
        if (auctionRequest.minimumBid() != null && auctionRequest.minimumBid() > 0) {
            existingAuction.setMinimumBid(auctionRequest.minimumBid());
        }
        if (auctionRequest.auctionDate() != null) {
            existingAuction.setAuctionDate(auctionRequest.auctionDate());
        }
        if (auctionRequest.pointsPerTeam() != null && auctionRequest.pointsPerTeam() > 0) {
            existingAuction.setInitialPointsPerTeam(auctionRequest.pointsPerTeam());
        }
        if (auctionRequest.typeOfSport() != null && !auctionRequest.typeOfSport().isBlank()) {
            existingAuction.setTypeOfSport(auctionRequest.typeOfSport());
        }
        if (auctionRequest.status() != null && !"LIVE".equals(existingAuction.getStatus().toString())) {
            existingAuction.setStatus(auctionRequest.status());
        }

        // 🔧 update image ONLY if new bytes are provided
        if (imageBytes != null && imageBytes.length > 0) {
            existingAuction.setImage(imageBytes);
        }

        boolean exists = auctionRepository.existsByAuctionNameAndAdminIdAndIdNot(
                existingAuction.getAuctionName(),
                existingAuction.getAdmin().getId(),
                existingAuction.getId()
        );
        if (exists) {
            throw new AuctionDuplicationException(
                    "Auction with name '" + existingAuction.getAuctionName() + "' already exists for this admin"
            );
        }

        Auction saved = auctionRepository.save(existingAuction);
        return auctionMapper.mapToAuctionResponse(saved);
    }


    public void delete(Long id) {
        auctionRepository.deleteById(id);
    }

    public byte[] getAuctionImage(Long id) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AuctionNotFoundException("Auction not found"));
        return auction.getImage();


    }

    public List<Auction> findByAdminId(Long adminId) {
        return auctionRepository.findByAdminId(adminId);
    }

    public Bid placeBid(Long playerId, Long teamId, double amount) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        if (team.getCurrentTotalPoints() < amount || player.isSold()) {
            throw new RuntimeException("Invalid bid: Insufficient budget or player already sold");
        }
        Bid bid = new Bid();
        bid.setPlayer(player);
        bid.setTeam(team);
        bid.setBidAmount(amount);
        bid.setTimestamp(LocalDateTime.now());
        return bidRepository.save(bid);
    }

    public void allocatePlayer(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        if (player.isSold()) {
            return;
        }

        List<Bid> bids = bidRepository.findByPlayer(player);
        if (bids.isEmpty()) {
            return;
        }

        Bid highestBid = bids.stream()
                .max((b1, b2) -> Double.compare(b1.getBidAmount(), b2.getBidAmount()))
                .get();
        Team winningTeam = highestBid.getTeam();
        winningTeam.setCurrentTotalPoints(winningTeam.getCurrentTotalPoints() - highestBid.getBidAmount());
        teamRepository.save(winningTeam);

        PlayerAllocation allocation = new PlayerAllocation();
        allocation.setPlayer(player);
        allocation.setTeam(winningTeam);
        allocation.setFinalPrice(highestBid.getBidAmount());
        allocationRepository.save(allocation);

        player.setSold(true);
        playerRepository.save(player);
    }


}