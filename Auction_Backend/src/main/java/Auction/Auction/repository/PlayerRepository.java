package Auction.Auction.repository;

import Auction.Auction.entity.Player;
import Auction.Auction.entity.PlayerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    @Query("SELECT p FROM Player p WHERE p.auction.id = :auctionId")
    List<Player> findByAuctionId(@Param("auctionId") Long auctionId);

    @Query("SELECT p FROM Player p WHERE p.auction.id = :auctionId AND p.email = :email")
    Optional<Player> findByAuctionIdAndEmail(@Param("auctionId") Long auctionId, @Param("email") String email);

    List<Player> findBySoldFalse();

    // NEW: by status per auction
    @Query("SELECT p FROM Player p WHERE p.auction.id = :auctionId AND p.playerStatus = :status")
    List<Player> findByAuctionIdAndPlayerStatus(@Param("auctionId") Long auctionId, @Param("status") PlayerStatus status);

    // NEW: IDs only for available players in an auction
    @Query("SELECT p.id FROM Player p WHERE p.auction.id = :auctionId AND p.playerStatus = :status")
    List<Long> findIdsByAuctionIdAndPlayerStatus(@Param("auctionId") Long auctionId, @Param("status") PlayerStatus status);

}
