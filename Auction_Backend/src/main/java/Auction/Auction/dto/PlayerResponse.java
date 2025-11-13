package Auction.Auction.dto;

import Auction.Auction.entity.Player;
import Auction.Auction.entity.PlayerStatus;

import java.util.Base64;

public record PlayerResponse(
        Long id,
        String firstname,
        String lastname,
        String mobileno,
        String email,
        String dob,
        String tshirtSize,
        String bottomSize,
        String typeOfSportCategory,
        boolean sold,
        Long auctionId,
        String imageBase64,
        String imageType,

        // NEW
        String playerStatus,   // enum as string
        Long bidTeamId,        // null if no team
        String bidTeamName,    // null if team has no name
        Double bidAmount
) {
    private static String detectImageType(byte[] imageData) {
        if (imageData == null || imageData.length < 8) return "image/jpeg";
        if (imageData[0] == (byte) 0xFF && imageData[1] == (byte) 0xD8 && imageData[2] == (byte) 0xFF)
            return "image/jpeg";
        if (imageData[0] == (byte) 0x89 && imageData[1] == (byte) 0x50 &&
                imageData[2] == (byte) 0x4E && imageData[3] == (byte) 0x47 &&
                imageData[4] == (byte) 0x0D && imageData[5] == (byte) 0x0A &&
                imageData[6] == (byte) 0x1A && imageData[7] == (byte) 0x0A) return "image/png";
        if (imageData[0] == (byte) 0x47 && imageData[1] == (byte) 0x49 &&
                imageData[2] == (byte) 0x46 && imageData[3] == (byte) 0x38) return "image/gif";
        if (imageData.length >= 12 &&
                imageData[0] == (byte) 0x52 && imageData[1] == (byte) 0x49 &&
                imageData[2] == (byte) 0x46 && imageData[3] == (byte) 0x46 &&
                imageData[8] == (byte) 0x57 && imageData[9] == (byte) 0x45 &&
                imageData[10] == (byte) 0x42 && imageData[11] == (byte) 0x50) return "image/webp";
        return "image/jpeg";
    }

    public PlayerResponse(Player player) {
        this(
                player.getId(),
                player.getFirstname(),
                player.getLastname(),
                player.getMobileNo(),
                player.getEmail(),
                player.getDob() != null ? player.getDob().toString() : null,
                player.getTShirtSize(),
                player.getBottomSize(),
                player.getTypeOfSportCategory(),
                player.isSold(),
                player.getAuction() != null ? player.getAuction().getId() : null,
                player.getImage() != null && player.getImage().length > 0
                        ? "data:" + detectImageType(player.getImage()) + ";base64," + Base64.getEncoder().encodeToString(player.getImage())
                        : null,
                player.getImage() != null && player.getImage().length > 0 ? detectImageType(player.getImage()) : null,

                // NEW
                player.getPlayerStatus() != null ? player.getPlayerStatus().name() : PlayerStatus.AVAILABLE.name(),
                player.getCurrentBidTeam() != null ? player.getCurrentBidTeam().getId() : null,
                player.getCurrentBidTeam() != null ? player.getCurrentBidTeam().getName() : null, // assumes Team#getName()
                player.getCurrentBidAmount()
        );
    }
}
