package Auction.Auction.controller;

import Auction.Auction.entity.PlayerAllocation;
import Auction.Auction.service.PlayerAllocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/allocations")
public class PlayerAllocationController {
    @Autowired
    private PlayerAllocationService allocationService;

    @GetMapping
    public List<PlayerAllocation> getAllAllocations() {
        return allocationService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerAllocation> getAllocationById(@PathVariable Long id) {
        return allocationService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PlayerAllocation createAllocation(@RequestBody PlayerAllocation allocation) {
        return allocationService.save(allocation);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlayerAllocation> updateAllocation(@PathVariable Long id, @RequestBody PlayerAllocation allocation) {
        try {
            return ResponseEntity.ok(allocationService.update(id, allocation));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAllocation(@PathVariable Long id) {
        allocationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}