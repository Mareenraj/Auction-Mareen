package Auction.Auction.service;

import Auction.Auction.entity.PlayerAllocation;
import Auction.Auction.repository.PlayerAllocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlayerAllocationService {
    @Autowired
    private PlayerAllocationRepository allocationRepository;

    public List<PlayerAllocation> findAll() {
        return allocationRepository.findAll();
    }

    public Optional<PlayerAllocation> findById(Long id) {
        return allocationRepository.findById(id);
    }

    public PlayerAllocation save(PlayerAllocation allocation) {
        return allocationRepository.save(allocation);
    }

    public PlayerAllocation update(Long id, PlayerAllocation updatedAllocation) {
        Optional<PlayerAllocation> existingAllocation = allocationRepository.findById(id);
        if (existingAllocation.isPresent()) {
            PlayerAllocation allocation = existingAllocation.get();
            allocation.setPlayer(updatedAllocation.getPlayer());
            allocation.setTeam(updatedAllocation.getTeam());
            allocation.setFinalPrice(updatedAllocation.getFinalPrice());
            return allocationRepository.save(allocation);
        } else {
            throw new RuntimeException("PlayerAllocation not found with id: " + id);
        }
    }

    public void delete(Long id) {
        allocationRepository.deleteById(id);
    }
}