package Auction.Auction.repository;

import Auction.Auction.entity.Bid;
import Auction.Auction.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByPlayer(Player player);
}