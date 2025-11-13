package Auction.Auction.service;

import Auction.Auction.entity.Player;
import Auction.Auction.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class AuctionWheelService {
    @Autowired
    private PlayerRepository playerRepository;

    private final Random random = new Random();
    private int currentRound = 0;


//      Increment the round counter

    public void startNewRound() {
        currentRound++;
    }

    /**
     * Selects a random player for bidding based on the specified round
     * First round: Select from all players
     * Subsequent rounds: Select from unsold players only
     *
     * @param round The bidding round
     * @return Selected Player or null if no players available
     */
    public Player selectNextPlayer(int round) {
        List<Player> availablePlayers;
        if (round == 1) {
            availablePlayers = playerRepository.findAll();
        } else {
            availablePlayers = playerRepository.findBySoldFalse();
        }

        if (availablePlayers.isEmpty()) {
            return null;
        }

        int randomIndex = random.nextInt(availablePlayers.size());
        return availablePlayers.get(randomIndex);
    }

    /**
     * Get available players based on the specified round
     * First round: All players
     * Subsequent rounds: Unsold players
     *
     * @param round The bidding round
     * @return List of available players
     */
    public List<Player> getAvailablePlayers(int round) {
        if (round == 1) {
            return playerRepository.findAll();
        }
        return playerRepository.findBySoldFalse();
    }


//     Reset rounds for a new auction

    public void resetRounds() {
        currentRound = 0;
    }
}