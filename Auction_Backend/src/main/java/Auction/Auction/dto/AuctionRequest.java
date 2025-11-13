package Auction.Auction.dto;

import Auction.Auction.entity.AuctionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AuctionRequest(
        @NotNull(message = "Admin ID is required")
        Long adminId,

        @NotBlank(message = "Auction name is required")
        @Size(max = 50, message = "Auction name must not exceed 50 characters")
        String auctionName,


        @NotNull(message = "AuctionDate is required")
        LocalDateTime auctionDate,

        @NotNull(message = "SportType  is required")
        String typeOfSport,

        @Positive(message = "BidIncrease must be greater than 0")
        Double bidIncreaseBy,

        @Positive(message = "Minimum Bid must be greater than 0")
        Double minimumBid,

        @Positive(message = "Points Per Team  must be greater than 0")
        Double pointsPerTeam,

        @Positive(message = " Team Players must be greater than 0")
        Integer playerPerTeam,

        @NotNull(message = "Auction Status  is required")
        AuctionStatus status


) {
}