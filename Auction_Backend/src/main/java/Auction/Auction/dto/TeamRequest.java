package Auction.Auction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record TeamRequest(
        @NotBlank(message = "Team name is required")
        @Size(max = 50, message = "Team name must not exceed 50 characters")
        String name,


        @Positive(message = "Budget must be greater than 0")
        double budget,


        @NotNull(message = "Owner ID is required")
        Long ownerId,


        @NotNull(message = "Auction ID is required")
        Long auctionId
) {
}
