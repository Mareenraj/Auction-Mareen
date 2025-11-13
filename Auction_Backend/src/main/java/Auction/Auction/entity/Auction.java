package Auction.Auction.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "auctions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"admin_id", "auction_name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Auction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String auctionName;
    @Column(nullable = false)
    private LocalDateTime auctionDate;
    @Column(nullable = false)
    private String typeOfSport;
    @Column(nullable = false)
    private Double bidIncreaseBy;
    @Column(nullable = false)
    private Double minimumBid;
    @Column(nullable = false)
    private Double initialPointsPerTeam;
    @Column(nullable = false)
    private Integer playerPerTeam;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AuctionStatus status;

    @Lob
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User admin;

    @OneToMany(mappedBy = "auction", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Team> teams = new ArrayList<>();
}