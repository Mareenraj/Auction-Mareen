package Auction.Auction.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "players", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"auction_id", "email"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"image", "auction", "bidTeam"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String firstname;
    private String lastname;
    private String mobileNo;
    private String email;
    private LocalDate dob;
    private String tShirtSize;
    private String bottomSize;
    private String typeOfSportCategory;
    private boolean sold;

    @ManyToOne
    @JoinColumn(name = "auction_id")
    private Auction auction;

    @Lob
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image;

    @Enumerated(EnumType.STRING)
    @Column(name = "player_status", nullable = false)
    private PlayerStatus playerStatus;

    @ManyToOne
    @JoinColumn(name = "current_bid_team_id")
    private Team currentBidTeam;

    // NEW
    @Column(name = "current_bid_amount")
    private Double currentBidAmount;


    @PrePersist
    public void prePersist() {
        if (playerStatus == null) {
            playerStatus = PlayerStatus.AVAILABLE;
        }
        // keep "sold" consistent
        this.sold = (playerStatus == PlayerStatus.SOLD);
    }

    @PreUpdate
    public void preUpdate() {
        this.sold = (playerStatus == PlayerStatus.SOLD);
    }
}
