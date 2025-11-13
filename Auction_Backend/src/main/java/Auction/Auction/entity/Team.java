package Auction.Auction.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "teams", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"auction_id", "name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private Double currentTotalPoints;
    @Column(nullable = false)
    private Double currentMaxAllowedPointsPerPlayer;
    @Column(nullable = false)
    private Integer currentPlayerCount;
    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
    @ManyToOne
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;
    @Lob
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image;
}