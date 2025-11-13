package Auction.Auction.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Entity
@Table(name = "user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;// Default to USER
    @Column(nullable = false)
    private boolean isVerified = false;

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;  // Use email as username
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;  // Or implement expiration logic if needed
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;  // Or implement lock logic
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;  // Or implement credential expiration
    }

    @Override
    public boolean isEnabled() {
        return isVerified;  // Only enabled if verified
    }
}