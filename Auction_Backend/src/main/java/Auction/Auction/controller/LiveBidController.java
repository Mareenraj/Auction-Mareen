package Auction.Auction.controller;

import Auction.Auction.dto.BidRequest;
import Auction.Auction.dto.BidResponse;
import Auction.Auction.service.BidService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class LiveBidController {

    private final BidService bidService;

    public LiveBidController(BidService bidService) {
        this.bidService = bidService;
    }

    @MessageMapping("/bid/{auctionId}/{playerId}")
    @SendTo("/topic/auction/{auctionId}/player/{playerId}")
    public BidResponse handleBid(@DestinationVariable Long auctionId,
                                 @DestinationVariable Long playerId,
                                 @Payload BidRequest bidRequest) {
        Long userId = bidRequest.userId();
        return bidService.saveBid(auctionId, playerId, userId);
    }
}