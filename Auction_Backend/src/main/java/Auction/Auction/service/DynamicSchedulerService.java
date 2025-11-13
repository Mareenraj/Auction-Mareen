package Auction.Auction.service;

import Auction.Auction.entity.Auction;
import Auction.Auction.entity.AuctionStatus;
import Auction.Auction.repository.AuctionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DynamicSchedulerService {

    private final AuctionRepository auctionRepository;

    public DynamicSchedulerService(AuctionRepository auctionRepository) {
        this.auctionRepository = auctionRepository;
    }

    @Scheduled(fixedRate = 60000)      //every one minute
    public void checkAndUpdateAuctions() {

        List<Auction> auctionList = auctionRepository.findAllByStatusIsNotIn(
                List.of(AuctionStatus.LIVE, AuctionStatus.CLOSED, AuctionStatus.COMPLETED)
        );

        LocalDateTime currentDateTime = LocalDateTime.now();

        for (Auction auction : auctionList) {
            if (!auction.getAuctionDate().isAfter(currentDateTime)) {
                auction.setStatus(AuctionStatus.LIVE);
                auctionRepository.save(auction);
            }
        }
    }
}
