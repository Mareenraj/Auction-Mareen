package Auction.Auction.exception;

public class UserNotTeamOwnerException extends RuntimeException {
    public UserNotTeamOwnerException(String message) {
        super(message);
    }
}
