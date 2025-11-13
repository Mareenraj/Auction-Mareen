package Auction.Auction.service;

import Auction.Auction.entity.Player;
import Auction.Auction.entity.PlayerStatus;
import Auction.Auction.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class PlayerService {
    @Autowired
    private PlayerRepository playerRepository;

    public List<Player> findAll() {
        return playerRepository.findAll();
    }

    public Optional<Player> findById(Long id) {
        return playerRepository.findById(id);
    }

    public List<Player> findByAuctionId(Long auctionId) {
        return playerRepository.findByAuctionId(auctionId);
    }

    // NEW convenience finders
    public List<Player> findAvailableByAuctionId(Long auctionId) {
        return playerRepository.findByAuctionIdAndPlayerStatus(auctionId, PlayerStatus.AVAILABLE);
    }

    public List<Player> findSoldByAuctionId(Long auctionId) {
        return playerRepository.findByAuctionIdAndPlayerStatus(auctionId, PlayerStatus.SOLD);
    }

    public List<Player> findUnsoldByAuctionId(Long auctionId) {
        return playerRepository.findByAuctionIdAndPlayerStatus(auctionId, PlayerStatus.UNSOLD);
    }

    public List<Long> findAvailableIdsByAuctionId(Long auctionId) {
        return playerRepository.findIdsByAuctionIdAndPlayerStatus(auctionId, PlayerStatus.AVAILABLE);
    }

    public Long findRandomAvailableIdByAuctionId(Long auctionId) {
        List<Long> ids = playerRepository.findIdsByAuctionIdAndPlayerStatus(
                auctionId, PlayerStatus.AVAILABLE);

        if (ids.isEmpty()) {
            throw new IllegalStateException("No AVAILABLE players for auction " + auctionId);
        }

        Random random = new Random();
        return ids.get(random.nextInt(ids.size()));
    }

    public Player save(Player player) {
        // enforce unique (auction_id, email)
        if (player.getAuction() != null && player.getAuction().getId() != null && player.getEmail() != null) {
            Optional<Player> existingPlayer = playerRepository.findByAuctionIdAndEmail(player.getAuction().getId(), player.getEmail());
            if (existingPlayer.isPresent()) {
                throw new RuntimeException("Player with email " + player.getEmail() +
                        " already exists in auction " + player.getAuction().getId());
            }
        }

        // default and sync status/sold
        if (player.getPlayerStatus() == null) {
            player.setPlayerStatus(PlayerStatus.AVAILABLE);
        }
        player.setSold(player.getPlayerStatus() == PlayerStatus.SOLD);

        return playerRepository.save(player);
    }

    public Player update(Long id, Player updatedPlayer) {
        Optional<Player> existingPlayer = playerRepository.findById(id);
        if (existingPlayer.isEmpty()) {
            throw new RuntimeException("Player not found with id: " + id);
        }

        Player player = existingPlayer.get();
        player.setFirstname(updatedPlayer.getFirstname());
        player.setLastname(updatedPlayer.getLastname());
        player.setMobileNo(updatedPlayer.getMobileNo());
        player.setEmail(updatedPlayer.getEmail());
        player.setDob(updatedPlayer.getDob());
        player.setTShirtSize(updatedPlayer.getTShirtSize());
        player.setBottomSize(updatedPlayer.getBottomSize());
        player.setTypeOfSportCategory(updatedPlayer.getTypeOfSportCategory());
        player.setAuction(updatedPlayer.getAuction());

        // NEW fields
        player.setCurrentBidTeam(updatedPlayer.getCurrentBidTeam());
        player.setCurrentBidAmount(updatedPlayer.getCurrentBidAmount());

        // Status: if provided, use it; otherwise keep existing
        if (updatedPlayer.getPlayerStatus() != null) {
            player.setPlayerStatus(updatedPlayer.getPlayerStatus());
        }
        // keep "sold" consistent with status
        player.setSold(player.getPlayerStatus() == PlayerStatus.SOLD);

        // image (optional)
        if (updatedPlayer.getImage() != null && updatedPlayer.getImage().length > 0) {
            player.setImage(updatedPlayer.getImage());
        }

        return playerRepository.save(player);
    }

    public void delete(Long id) {
        playerRepository.deleteById(id);
    }
}
