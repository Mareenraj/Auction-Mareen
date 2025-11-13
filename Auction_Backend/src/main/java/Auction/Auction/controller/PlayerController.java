package Auction.Auction.controller;

import Auction.Auction.dto.PlayerResponse;
import Auction.Auction.entity.Player;
import Auction.Auction.entity.PlayerStatus;
import Auction.Auction.service.PlayerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/players")
public class PlayerController {
    @Autowired
    private PlayerService playerService;

    @GetMapping
    public List<PlayerResponse> getAllPlayers() {
        return playerService.findAll().stream()
                .map(PlayerResponse::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerResponse> getPlayerById(@PathVariable Long id) {
        return playerService.findById(id)
                .map(player -> ResponseEntity.ok(new PlayerResponse(player)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/auction/{auctionId}")
    public ResponseEntity<List<PlayerResponse>> getPlayersByAuctionId(@PathVariable Long auctionId) {
        List<Player> players = playerService.findByAuctionId(auctionId);
        List<PlayerResponse> response = players.stream()
                .map(PlayerResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // -------- NEW FILTERED ENDPOINTS --------

    @GetMapping("/auction/{auctionId}/status/available")
    public ResponseEntity<List<PlayerResponse>> getAvailablePlayers(@PathVariable Long auctionId) {
        return ResponseEntity.ok(
                playerService.findAvailableByAuctionId(auctionId).stream()
                        .map(PlayerResponse::new)
                        .collect(Collectors.toList())
        );
    }

    @GetMapping(value = "/{auctionId}/available", produces = "application/json")
    public ResponseEntity<Long> getRandomAvailablePlayerId(@PathVariable Long auctionId) {
        Long randomId = playerService.findRandomAvailableIdByAuctionId(auctionId);
        return ResponseEntity.ok(randomId);
    }

    @GetMapping("/auction/{auctionId}/status/sold")
    public ResponseEntity<List<PlayerResponse>> getSoldPlayers(@PathVariable Long auctionId) {
        return ResponseEntity.ok(
                playerService.findSoldByAuctionId(auctionId).stream()
                        .map(PlayerResponse::new)
                        .collect(Collectors.toList())
        );
    }

    @GetMapping("/auction/{auctionId}/status/unsold")
    public ResponseEntity<List<PlayerResponse>> getUnsoldPlayers(@PathVariable Long auctionId) {
        return ResponseEntity.ok(
                playerService.findUnsoldByAuctionId(auctionId).stream()
                        .map(PlayerResponse::new)
                        .collect(Collectors.toList())
        );
    }

    // IDs only for available players in an auction
    @GetMapping("/auction/{auctionId}/available/ids")
    public ResponseEntity<List<Long>> getAvailablePlayerIds(@PathVariable Long auctionId) {
        return ResponseEntity.ok(playerService.findAvailableIdsByAuctionId(auctionId));
    }

    /**
     * Endpoint to get player image as raw bytes (alternative to Base64)
     * This is useful if you want to serve images directly as binary data
     */
    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getPlayerImage(@PathVariable Long id) {
        Optional<Player> playerOpt = playerService.findById(id);

        if (playerOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Player player = playerOpt.get();
        if (player.getImage() == null || player.getImage().length == 0) {
            return ResponseEntity.noContent().build();
        }

        String contentType = detectContentType(player.getImage());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentLength(player.getImage().length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(player.getImage());
    }

    private String detectContentType(byte[] imageData) {
        if (imageData == null || imageData.length < 8) {
            return MediaType.IMAGE_JPEG_VALUE;
        }
        if (imageData[0] == (byte) 0xFF && imageData[1] == (byte) 0xD8 && imageData[2] == (byte) 0xFF) {
            return MediaType.IMAGE_JPEG_VALUE;
        }
        if (imageData[0] == (byte) 0x89 && imageData[1] == (byte) 0x50 &&
                imageData[2] == (byte) 0x4E && imageData[3] == (byte) 0x47 &&
                imageData[4] == (byte) 0x0D && imageData[5] == (byte) 0x0A &&
                imageData[6] == (byte) 0x1A && imageData[7] == (byte) 0x0A) {
            return MediaType.IMAGE_PNG_VALUE;
        }
        if (imageData[0] == (byte) 0x47 && imageData[1] == (byte) 0x49 &&
                imageData[2] == (byte) 0x46 && imageData[3] == (byte) 0x38) {
            return MediaType.IMAGE_GIF_VALUE;
        }
        if (imageData.length >= 12 &&
                imageData[0] == (byte) 0x52 && imageData[1] == (byte) 0x49 &&
                imageData[2] == (byte) 0x46 && imageData[3] == (byte) 0x46 &&
                imageData[8] == (byte) 0x57 && imageData[9] == (byte) 0x45 &&
                imageData[10] == (byte) 0x42 && imageData[11] == (byte) 0x50) {
            return "image/webp";
        }
        return MediaType.IMAGE_JPEG_VALUE;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlayerResponse> createPlayer(
            @RequestPart("player") String playerJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            Player player = mapper.readValue(playerJson, Player.class);

            // default status if client didn't send it
            if (player.getPlayerStatus() == null) {
                player.setPlayerStatus(PlayerStatus.AVAILABLE);
            }

            if (image != null && !image.isEmpty()) {
                String contentType = image.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    return ResponseEntity.badRequest().build();
                }
                if (image.getSize() > 5 * 1024 * 1024) {
                    return ResponseEntity.badRequest().build();
                }
                player.setImage(image.getBytes());
            }

            Player savedPlayer = playerService.save(player);
            return ResponseEntity.ok(new PlayerResponse(savedPlayer));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlayerResponse> updatePlayer(
            @PathVariable Long id,
            @RequestPart("player") String playerJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            Player player = mapper.readValue(playerJson, Player.class);

            if (image != null && !image.isEmpty()) {
                String contentType = image.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    return ResponseEntity.badRequest().build();
                }
                if (image.getSize() > 5 * 1024 * 1024) {
                    return ResponseEntity.badRequest().build();
                }
                player.setImage(image.getBytes());
            }

            Player updatedPlayer = playerService.update(id, player);
            return ResponseEntity.ok(new PlayerResponse(updatedPlayer));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePlayer(@PathVariable Long id) {
        try {
            playerService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
