package Auction.Auction.exception;

public class UserNotAdminException extends RuntimeException {
    public UserNotAdminException(String message) {
        super(message);
    }
}
