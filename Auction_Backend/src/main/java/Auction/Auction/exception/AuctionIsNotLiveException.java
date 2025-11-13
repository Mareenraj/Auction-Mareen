package Auction.Auction.exception;

public class AuctionIsNotLiveException extends RuntimeException {
    public AuctionIsNotLiveException(String message) {
        super(message);
    }
}
