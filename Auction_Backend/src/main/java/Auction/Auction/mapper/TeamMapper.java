package Auction.Auction.mapper;

import Auction.Auction.dto.TeamRequest;
import Auction.Auction.dto.TeamResponse;
import Auction.Auction.entity.Auction;
import Auction.Auction.entity.Team;
import Auction.Auction.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TeamMapper {

    public TeamResponse mapToTeamResponse(Team team) {
        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getCurrentTotalPoints(),
                team.getOwner().getId(),
                team.getOwner().getEmail(),
                team.getAuction().getId(),
                "/teams/image/" + team.getId()
        );
    }

    public List<TeamResponse> mapToTeamResponseList(List<Team> teamList) {
        return teamList.stream().map(this::mapToTeamResponse).toList();
    }

    public Team mapToEntity(TeamRequest teamRequest, User owner, Auction auction, byte[] imageBytes) {
        Team team = new Team();
        team.setName(teamRequest.name());

        Double currentTotalPoints = auction.getInitialPointsPerTeam();
        Double bidIncreaseBy = auction.getBidIncreaseBy();
        Integer playerPerTeam = auction.getPlayerPerTeam();
        Double minimumBid = auction.getMinimumBid();

        Integer currentPlayerCount = 0;

        // When we create team initially, this algorithm is work fine.
        Double currentMaxAllowedPointsPerPlayer = currentTotalPoints - ((minimumBid + bidIncreaseBy) * (playerPerTeam - 1));

        team.setCurrentTotalPoints(currentTotalPoints);
        team.setCurrentMaxAllowedPointsPerPlayer(currentMaxAllowedPointsPerPlayer);
        team.setCurrentPlayerCount(currentPlayerCount);
        team.setOwner(owner);
        team.setAuction(auction);
        team.setImage(imageBytes);
        return team;
    }
}















