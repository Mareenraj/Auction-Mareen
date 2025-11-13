package Auction.Auction.controller;

import Auction.Auction.entity.Bid;
import Auction.Auction.entity.Player;
import Auction.Auction.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bids")
public class BidController {
    @Autowired
    private BidService bidService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<Bid> getAllBids() {
        return bidService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bid> getBidById(@PathVariable Long id) {
        return bidService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('TEAM_OWNER')")
    public ResponseEntity<Bid> createBid(@RequestBody Bid bid) {
        // Validate and save bid using AuctionService to reuse logic
        Bid savedBid = bidService.placeBid(
                bid.getPlayer().getId(),
                bid.getTeam().getId(),
                bid.getBidAmount()
        );
        return ResponseEntity.ok(savedBid);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEAM_OWNER')")
    public ResponseEntity<Bid> updateBid(@PathVariable Long id, @RequestBody Bid bid) {
        try {
            Bid updatedBid = bidService.update(id, bid);
            // Optionally broadcast updated bid
            messagingTemplate.convertAndSend("/topic/bids", updatedBid);
            return ResponseEntity.ok(updatedBid);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBid(@PathVariable Long id) {
        bidService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{playerId}/bid")
    @PreAuthorize("hasRole('TEAM_OWNER')")
    public ResponseEntity<Bid> placeBid(@PathVariable Long playerId, @RequestParam Long teamId, @RequestParam double amount) {
        return ResponseEntity.ok(bidService.placeBid(playerId, teamId, amount));
    }

//    @PostMapping("/{playerId}/allocate")
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<Void> allocatePlayer(@PathVariable Long playerId) {
//        bidService.allocatePlayer(playerId);
//        return ResponseEntity.ok().build();
//    }


    @PostMapping("/wheel-select")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Player> startWheelSelection() {
        Player selectedPlayer = bidService.startWheelSelection();
        if (selectedPlayer == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(selectedPlayer);
    }

    @GetMapping("/available-players")
    public List<Player> getAvailablePlayersForWheel() {
        return bidService.getAvailablePlayersForWheel();
    }
}