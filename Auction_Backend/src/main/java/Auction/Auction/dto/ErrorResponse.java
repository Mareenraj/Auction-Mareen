package Auction.Auction.dto;

import java.time.LocalDateTime;

public record ErrorResponse(
        int status,
        String message,
        LocalDateTime timeStamp
) {
    public ErrorResponse(int status, String message) {
        this(status, message, LocalDateTime.now());
    }
}
