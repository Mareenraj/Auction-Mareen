package Auction.Auction.exception;

public class InvalidOrExpiredVerificationCodeException extends RuntimeException {
    public InvalidOrExpiredVerificationCodeException(String message) {
        super(message);
    }
}
