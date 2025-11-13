package Auction.Auction.controller;

import Auction.Auction.dto.AuctionRequest;
import Auction.Auction.dto.AuctionResponse;
import Auction.Auction.entity.Auction;
import Auction.Auction.entity.Bid;
import Auction.Auction.exception.CantAddAuctionException;
import Auction.Auction.service.AuctionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/auctions")
@CrossOrigin(origins = "http://localhost:3000")
public class AuctionController {


    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @GetMapping
    public ResponseEntity<List<AuctionResponse>> getAllAucion() {
        List<AuctionResponse> auctionResponseList = auctionService.findAll();
        if (auctionResponseList.isEmpty()) {
            ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(auctionResponseList);
    }


    @GetMapping("/admin/{adminId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Auction> getAuctionsByAdmin(@PathVariable Long adminId) {
        return auctionService.findByAdminId(adminId);
    }


    @GetMapping("/{id}")
    public ResponseEntity<AuctionResponse> getAuctionById(@PathVariable Long id) {
        return ResponseEntity.ok(auctionService.getAuctionById(id));
    }


    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuctionResponse> createAuction(
            @RequestPart("auction") String auctionRequestJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile

    ) throws IOException, CantAddAuctionException {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        AuctionRequest auctionRequest = objectMapper.readValue(auctionRequestJson, AuctionRequest.class);


//     byte[] imageBytes = imageFile.getBytes();
        byte[] imageBytes = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            imageBytes = imageFile.getBytes();
        }
        return ResponseEntity.ok(auctionService.save(auctionRequest, imageBytes));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuctionResponse> updateAuction(
            @PathVariable Long id,
            @RequestPart("auction") String auctionRequestJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile
    ) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        AuctionRequest auctionRequest = objectMapper.readValue(auctionRequestJson, AuctionRequest.class);

        byte[] imageBytes = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            imageBytes = imageFile.getBytes();
        }

        return ResponseEntity.ok(auctionService.update(id, auctionRequest, imageBytes));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAuction(@PathVariable Long id) {
        auctionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/image/{id}")
    public ResponseEntity<byte[]> getAuctionImage(@PathVariable Long id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/png")
                .body(auctionService.getAuctionImage(id));
    }


    @PostMapping("/{playerId}/bid")
    @PreAuthorize("hasRole('TEAM_OWNER')")
    public ResponseEntity<Bid> placeBid(@PathVariable Long playerId, @RequestParam Long teamId, @RequestParam double amount) {
        return ResponseEntity.ok(auctionService.placeBid(playerId, teamId, amount));
    }

    @PostMapping("/{playerId}/allocate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> allocatePlayer(@PathVariable Long playerId) {
        auctionService.allocatePlayer(playerId);
        return ResponseEntity.ok().build();
    }
}