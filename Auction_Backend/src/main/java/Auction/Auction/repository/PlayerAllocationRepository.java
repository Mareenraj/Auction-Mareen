package Auction.Auction.repository;

import Auction.Auction.entity.PlayerAllocation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerAllocationRepository extends JpaRepository<PlayerAllocation, Long> {
}