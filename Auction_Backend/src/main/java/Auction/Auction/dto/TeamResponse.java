package Auction.Auction.dto;

public record TeamResponse(
        Long id,
        String name,
        double budget,
        Long ownerId,
        String ownerMail,
        Long auctionId,
        String imageUrl
) {
}