package Auction.Auction.dto;

import Auction.Auction.entity.AuctionStatus;

import java.time.LocalDateTime;

public record AuctionResponse(
        Long id,
        String auctionName,
        LocalDateTime auctionDate,
        String typeOfSport,
        Double bidIncreaseBy,
        Double minimumBid,
        Double pointsPerTeam,
        Integer playerPerTeam,
        AuctionStatus status,
        String imageUrl
) {

}
