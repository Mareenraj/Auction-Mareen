package Auction.Auction.controller;

import Auction.Auction.dto.TeamRequest;
import Auction.Auction.dto.TeamResponse;
import Auction.Auction.service.TeamService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/teams")
public class TeamController {
    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getAllTeams() {
        List<TeamResponse> teamResponseList = teamService.findAll();
        if (teamResponseList.isEmpty()) {
            ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(teamResponseList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamResponse> getTeamById(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    // Get teams by auctionId
    @GetMapping("/auction/{auctionId}")
    public ResponseEntity<List<TeamResponse>> getTeamsByAuction(@PathVariable Long auctionId) {
        return ResponseEntity.ok(teamService.getTeamsByAuctionId(auctionId));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('TEAM_OWNER')")
    public ResponseEntity<TeamResponse> createTeam(
            @RequestPart("team") String teamRequestJson,
            @RequestPart("image") MultipartFile imageFile
    ) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        TeamRequest teamRequest = objectMapper.readValue(teamRequestJson, TeamRequest.class);
        byte[] imageBytes = imageFile.getBytes();
        return ResponseEntity.ok(teamService.save(teamRequest, imageBytes));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEAM_OWNER')")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Long id,
            @RequestPart("team") String teamRequestJson,
            @RequestPart("image") MultipartFile imageFile
    ) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        TeamRequest teamRequest = objectMapper.readValue(teamRequestJson, TeamRequest.class);
        return ResponseEntity.ok(teamService.update(id, teamRequest, imageFile));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEAM_OWNER')")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/image/{id}")
    public ResponseEntity<byte[]> getTeamImage(@PathVariable Long id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/png")
                .body(teamService.getTeamImage(id));
    }
}