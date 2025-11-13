package Auction.Auction.repository;

import Auction.Auction.entity.Auction;
import Auction.Auction.entity.Team;
import Auction.Auction.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    @Query("SELECT t FROM Team t WHERE t.auction.id = :auctionId AND t.name = :name")
    Optional<Team> findByAuctionIdAndName(@Param("auctionId") Long auctionId, @Param("name") String name);

    Optional<Team> findByOwnerAndAuctionIs(User owner, Auction auction);

    List<Team> findByAuctionId(Long auctionId);
}