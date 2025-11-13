package Auction.Auction.controller;

import Auction.Auction.dto.LoginRequest;
import Auction.Auction.dto.LoginResponse;
import Auction.Auction.dto.RegisterRequest;
import Auction.Auction.dto.VerificationRequest;
import Auction.Auction.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest registerRequest) {
        authService.register(registerRequest);
        return ResponseEntity.ok("User registered. Please check your email for verification.");
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verify(@RequestBody VerificationRequest verificationRequest) {
        authService.verifyEmail(verificationRequest);
        return ResponseEntity.ok("Email verified successfully.");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse loginResponse = authService.login(request);
        return ResponseEntity.ok(loginResponse);
    }
}