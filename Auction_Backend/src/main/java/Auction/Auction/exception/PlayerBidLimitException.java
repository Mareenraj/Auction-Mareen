package Auction.Auction.exception;

public class PlayerBidLimitException extends RuntimeException {
    public PlayerBidLimitException(String message) {
        super(message);
    }
}
