package Auction.Auction.config;

import Auction.Auction.security.JwtTokenProvider;
import Auction.Auction.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.logging.Logger;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger LOGGER = Logger.getLogger(WebSocketConfig.class.getName());

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    public WebSocketConfig(JwtTokenProvider jwtTokenProvider, UserDetailsServiceImpl userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // For dev: SimpleBroker. In prod, consider RabbitMQ/Redis
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user"); // for private messages (/user/queue/..)
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-auction")
                .setAllowedOriginPatterns("*") // TODO: restrict to frontend domain in prod
                .withSockJS();

        registry.addEndpoint("/ws-auction-native")
                .setAllowedOriginPatterns("*"); // Native WebSocket (no SockJS)
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new JwtChannelInterceptor(jwtTokenProvider, userDetailsService));
    }

    /**
     * Intercepts CONNECT frames, validates JWT, attaches Authentication -> Principal
     */
    private static class JwtChannelInterceptor implements ChannelInterceptor {

        private final JwtTokenProvider jwtTokenProvider;
        private final UserDetailsServiceImpl userDetailsService;

        public JwtChannelInterceptor(JwtTokenProvider jwtTokenProvider,
                                     UserDetailsServiceImpl userDetailsService) {
            this.jwtTokenProvider = jwtTokenProvider;
            this.userDetailsService = userDetailsService;
        }

        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                LOGGER.info("WebSocket CONNECT attempt");

                String token = extractToken(accessor);
                if (token == null || !jwtTokenProvider.validateToken(token)) {
                    LOGGER.warning("Invalid or missing JWT during WebSocket connection");
                    throw new IllegalArgumentException("Unauthorized: invalid token");
                }

                String email = jwtTokenProvider.getEmailFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                Authentication authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                accessor.setUser(authentication); // ✅ now Principal available in controllers
                LOGGER.info("WebSocket authenticated: " + email);
            }

            return message;
        }

        private String extractToken(StompHeaderAccessor accessor) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7).trim();
                LOGGER.info("Extracted JWT token: " + token);
                return token;
            }

            String tokenParam = accessor.getFirstNativeHeader("token");
            if (tokenParam != null) {
                LOGGER.info("Extracted fallback token: " + tokenParam);
                return tokenParam.trim();
            }

            LOGGER.warning("No token found in headers");
            return null;
        }
    }
}