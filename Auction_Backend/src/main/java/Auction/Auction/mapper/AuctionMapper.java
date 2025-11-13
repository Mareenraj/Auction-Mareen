package Auction.Auction.mapper;

import Auction.Auction.dto.AuctionRequest;
import Auction.Auction.dto.AuctionResponse;
import Auction.Auction.entity.Auction;
import Auction.Auction.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AuctionMapper {
    public AuctionResponse mapToAuctionResponse(Auction auction) {
        return new AuctionResponse(
                auction.getId(),
                auction.getAuctionName(),
                auction.getAuctionDate(),
                auction.getTypeOfSport(),
                auction.getBidIncreaseBy(),
                auction.getMinimumBid(),
                auction.getInitialPointsPerTeam(),
                auction.getPlayerPerTeam(),
                auction.getStatus(),
                "/auctions/image/" + auction.getId()

        );
    }

    public List<AuctionResponse> mapToAuctionResponseList(List<Auction> auctionList) {
        return auctionList.stream().map(this::mapToAuctionResponse).toList();
    }

    public Auction mapToEntity(AuctionRequest auctionRequest, User admin, byte[] imageBytes) {
        Auction auction = new Auction();
        auction.setAdmin(admin);

        auction.setAuctionName(auctionRequest.auctionName());
        auction.setAuctionDate(auctionRequest.auctionDate());
        auction.setStatus(auctionRequest.status());
        auction.setMinimumBid(auctionRequest.minimumBid());
        auction.setInitialPointsPerTeam(auctionRequest.pointsPerTeam());
        auction.setPlayerPerTeam(auctionRequest.playerPerTeam());
        auction.setTypeOfSport(auctionRequest.typeOfSport());
        auction.setBidIncreaseBy(auctionRequest.bidIncreaseBy());
        auction.setImage(imageBytes);

        return auction;
    }

}
