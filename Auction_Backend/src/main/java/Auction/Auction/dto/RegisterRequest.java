package Auction.Auction.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email(message = "Email should be valid.")
        @NotBlank(message = "Email is required.")
        String email,
        @Size(min = 6, message = "Password should be minimum 6 characters long.")
        @NotBlank(message = "Password is required.")
        String password,
        @NotBlank(message = "role is required.")
        String role
) {
}
