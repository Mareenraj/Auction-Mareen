package Auction.Auction.dto;

public record VerificationRequest(
        String email,
        String code
) {
}
