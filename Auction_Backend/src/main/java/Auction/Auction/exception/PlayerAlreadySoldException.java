package Auction.Auction.exception;

public class PlayerAlreadySoldException extends RuntimeException {
    public PlayerAlreadySoldException(String message) {
        super(message);
    }
}
