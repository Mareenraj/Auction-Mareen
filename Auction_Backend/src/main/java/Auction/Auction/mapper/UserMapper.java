package Auction.Auction.mapper;

import Auction.Auction.dto.RegisterRequest;
import Auction.Auction.entity.Role;
import Auction.Auction.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public User RegisterRequestToUser(RegisterRequest registerRequest) {
        User user = new User();
        user.setEmail(registerRequest.email());
        user.setPassword(registerRequest.password());
        user.setRole(Role.valueOf(registerRequest.role()));
        return user;
    }
}
