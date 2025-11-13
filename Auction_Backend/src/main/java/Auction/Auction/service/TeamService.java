package Auction.Auction.service;

import Auction.Auction.dto.TeamRequest;
import Auction.Auction.dto.TeamResponse;
import Auction.Auction.entity.Auction;
import Auction.Auction.entity.Role;
import Auction.Auction.entity.Team;
import Auction.Auction.entity.User;
import Auction.Auction.exception.*;
import Auction.Auction.mapper.TeamMapper;
import Auction.Auction.repository.AuctionRepository;
import Auction.Auction.repository.TeamRepository;
import Auction.Auction.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    private final AuctionRepository auctionRepository;

    private final UserRepository userRepository;

    private final TeamMapper teamMapper;

    public TeamService(TeamRepository teamRepository, AuctionRepository auctionRepository, UserRepository userRepository, TeamMapper teamMapper) {
        this.teamRepository = teamRepository;
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
        this.teamMapper = teamMapper;
    }

    public List<TeamResponse> findAll() {
        List<Team> teamList = teamRepository.findAll();
        return teamMapper.mapToTeamResponseList(teamList);
    }

    public TeamResponse getTeamById(Long id) {
        Team team = teamRepository.findById(id).orElseThrow(() -> new TeamNotFoundException("Team not found."));
        return teamMapper.mapToTeamResponse(team);
    }

    // Get team list filtered by auctionId
    public List<TeamResponse> getTeamsByAuctionId(Long auctionId) {
        List<Team> teams = teamRepository.findByAuctionId(auctionId);
        if (teams.isEmpty()) {
            throw new TeamNotFoundException("No teams found for auction id: " + auctionId);
        }
        return teamMapper.mapToTeamResponseList(teams);
    }

    @Transactional
    public TeamResponse save(TeamRequest teamRequest, byte[] imageBytes) {
        Optional<User> optionalOwner = userRepository.findById(teamRequest.ownerId());
        if (optionalOwner.isEmpty()) {
            throw new UserNotFoundException("User not found!");
        }
        if (!optionalOwner.get().getRole().toString().equals("TEAM_OWNER")) {
            throw new UserNotTeamOwnerException("This user not Team Owner!");
        }
        User owner = optionalOwner.get();

        Optional<Auction> optionalAuction = auctionRepository.findById(teamRequest.auctionId());
        if (optionalAuction.isEmpty()) {
            throw new AuctionNotFoundException("Auction not found!");
        }
        if (optionalAuction.get().getStatus().toString().equals("LIVE")) {
            throw new CantAddTeamException("You can't add team, while auction is live!");
        }
        Auction auction = optionalAuction.get();

        Team team = teamMapper.mapToEntity(teamRequest, owner, auction, imageBytes);
        if (team.getName() != null) {
            Optional<Team> existingTeam = teamRepository.findByAuctionIdAndName(team.getAuction().getId(), team.getName());
            if (existingTeam.isPresent()) {
                throw new TeamDuplicationException("Team with name " + team.getName() + " already exists in auction " + team.getAuction().getId());
            }
        }

        return teamMapper.mapToTeamResponse(teamRepository.save(team));
    }

    @Transactional
    public TeamResponse update(Long id, TeamRequest teamRequest, MultipartFile imageFile) {
        Team existingTeam = teamRepository.findById(id)
                .orElseThrow(() -> new TeamNotFoundException("Team not found with id: " + id));

        if (teamRequest.name() != null && !teamRequest.name().isBlank()) {
            existingTeam.setName(teamRequest.name());
        }
        if (teamRequest.budget() > 0) {
            existingTeam.setCurrentTotalPoints(teamRequest.budget());
        }
        if (teamRequest.ownerId() != null) {
            User owner = userRepository.findById(teamRequest.ownerId())
                    .orElseThrow(() -> new UserNotFoundException("User not found with id: " + teamRequest.ownerId()));
            if (owner.getRole() != Role.TEAM_OWNER) {
                throw new UserNotTeamOwnerException("This user is not a Team Owner!");
            }
            existingTeam.setOwner(owner);
        }
        if (teamRequest.auctionId() != null) {
            Auction auction = auctionRepository.findById(teamRequest.auctionId())
                    .orElseThrow(() -> new AuctionNotFoundException("Auction not found with id: " + teamRequest.auctionId()));
            if (auction.getStatus().toString().equals("LIVE")) {
                throw new CantAddTeamException("You can't update team to this auction while it's live!");
            }
            teamRepository.findByAuctionIdAndName(auction.getId(), teamRequest.name())
                    .filter(team -> !team.getId().equals(existingTeam.getId()))
                    .ifPresent(team -> {
                        throw new TeamDuplicationException("Team with name " + team.getName()
                                + " already exists in auction " + auction.getId());
                    });
            existingTeam.setAuction(auction);
        }
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                byte[] imageBytes = imageFile.getBytes();
                existingTeam.setImage(imageBytes);
            } catch (IOException e) {
                throw new ImageProcessException("Failed to process image: " + e.getMessage());
            }
        }
        Team savedTeam = teamRepository.save(existingTeam);
        return teamMapper.mapToTeamResponse(savedTeam);
    }

    public void delete(Long id) {
        teamRepository.deleteById(id);
    }

    public byte[] getTeamImage(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new TeamNotFoundException("Team not found"));
        return team.getImage();
    }
}