package Auction.Auction.service;

import Auction.Auction.dto.LoginRequest;
import Auction.Auction.dto.LoginResponse;
import Auction.Auction.dto.RegisterRequest;
import Auction.Auction.dto.VerificationRequest;
import Auction.Auction.entity.User;
import Auction.Auction.exception.EmailAlreadyUsedException;
import Auction.Auction.exception.EmailNotVerifiedException;
import Auction.Auction.exception.InvalidOrExpiredVerificationCodeException;
import Auction.Auction.exception.UserNotFoundException;
import Auction.Auction.mapper.UserMapper;
import Auction.Auction.repository.UserRepository;
import Auction.Auction.security.JwtTokenProvider;
import Auction.Auction.util.VerificationCodeGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final RedisTemplate<String, Object> redisTemplate;
    private final EmailService emailService;

    @Value("${verification.code.expiry}")
    private int codeExpirySeconds;

    public AuthService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider, AuthenticationManager authenticationManager, RedisTemplate<String, Object> redisTemplate, EmailService emailService) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.redisTemplate = redisTemplate;
        this.emailService = emailService;
    }

    public void register(RegisterRequest registerRequest) {
        Optional<User> optionalUser = userRepository.findByEmail(registerRequest.email());
        if (optionalUser.isPresent() && optionalUser.get().isEnabled()) {
            throw new EmailAlreadyUsedException(registerRequest.email() + " This email already is used, please try with different email.");
        }
        if (optionalUser.isEmpty()) {
            User user = userMapper.RegisterRequestToUser(registerRequest);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            userRepository.save(user);
        }
        String code = VerificationCodeGenerator.generateCode();
        String key = "verification:" + registerRequest.email();
        redisTemplate.opsForValue().set(key, code, Duration.ofSeconds(codeExpirySeconds));
        emailService.sendVerificationEmail(registerRequest.email(), code);
    }

    public void verifyEmail(VerificationRequest verificationRequest) {
        String key = "verification:" + verificationRequest.email();
        String storedCode = (String) redisTemplate.opsForValue().get(key);
        if (storedCode == null || !storedCode.equals(verificationRequest.code())) {
            throw new InvalidOrExpiredVerificationCodeException("Invalid or expired verification code");
        }
        Optional<User> optionalUser = userRepository.findByEmail(verificationRequest.email());
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setVerified(true);
            userRepository.save(user);
            redisTemplate.delete(key);
        } else {
            throw new UserNotFoundException("User not found");
        }
    }

    public LoginResponse login(LoginRequest request) {
        // Check if verified (before authentication)
        userRepository.findByEmail(request.email())
                .filter(User::isEnabled)  // Uses isEnabled() from UserDetails
                .orElseThrow(() -> new EmailNotVerifiedException("Email not verified"));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = (User) authentication.getPrincipal();// Now casts to your User entity
        String token = jwtTokenProvider.generateToken(user);
        return new LoginResponse(user.getId(), user.getEmail(), user.getRole().toString(), token);  // Pass your User to generate JWT
    }
}
