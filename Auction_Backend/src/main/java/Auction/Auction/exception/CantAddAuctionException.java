package Auction.Auction.exception;

public class CantAddAuctionException extends RuntimeException {
    public CantAddAuctionException(String message) {
        super(message);
    }
}
