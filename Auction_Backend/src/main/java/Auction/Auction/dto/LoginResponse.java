package Auction.Auction.dto;

public record LoginResponse(
        Long id,
        String email,
        String role,
        String token
) {
}
