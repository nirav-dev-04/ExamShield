package com.examshield.backend.config;

import com.examshield.backend.model.ExamAttempt;
import com.examshield.backend.model.User;
import com.examshield.backend.model.UserRole;
import com.examshield.backend.repository.ExamAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import java.security.Principal;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    @Lazy
    private ExamAttemptRepository examAttemptRepository;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5173")
                .addInterceptors(new CsrfHandshakeInterceptor()) // Register CSRF handshake interceptor
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.taskExecutor()
                .corePoolSize(16)
                .maxPoolSize(64)
                .keepAliveSeconds(60);
        registration.interceptors(getInboundChannelInterceptor());
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.taskExecutor()
                .corePoolSize(16)
                .maxPoolSize(64)
                .keepAliveSeconds(60);
    }

    /**
     * Exposes the inbound channel interceptor to enable unit and integration testing.
     */
    public ChannelInterceptor getInboundChannelInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null) {
                    StompCommand command = accessor.getCommand();

                    // 1. Double submit CSRF verification on CONNECT
                    if (StompCommand.CONNECT.equals(command)) {
                        String csrfTokenHeader = accessor.getFirstNativeHeader("X-XSRF-TOKEN");
                        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes == null || sessionAttributes.containsKey("CSRF_TOKEN")) {
                            CsrfToken expectedToken = sessionAttributes != null ? (CsrfToken) sessionAttributes.get("CSRF_TOKEN") : null;
                            if (expectedToken == null) {
                                throw new AccessDeniedException("No expected CSRF token found in handshake session");
                            }
                            if (csrfTokenHeader == null || !expectedToken.getToken().equals(csrfTokenHeader)) {
                                throw new AccessDeniedException("Invalid CSRF token for STOMP connection");
                            }
                        }
                    }

                    // 2. Topic subscription security check with student ownership validation
                    if (StompCommand.SUBSCRIBE.equals(command)) {
                        String destination = accessor.getDestination();
                        Principal principal = accessor.getUser();

                        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
                            User user = (User) auth.getPrincipal();
                            
                            if (destination != null) {
                                // Proctor topics: e.g., /topic/exam/{examId}/violations or /topic/exam/{examId}/track
                                if (destination.startsWith("/topic/exam/") && (destination.endsWith("/violations") || destination.endsWith("/track"))) {
                                    if (user.getRole() != UserRole.PROCTOR && user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.SUPER_ADMIN) {
                                        throw new AccessDeniedException("Only proctors or admins can subscribe to exam violations or track updates");
                                    }
                                }
                                // Student private attempt status topics: e.g., /topic/attempt/{attemptId}/status
                                if (destination.startsWith("/topic/attempt/") && destination.endsWith("/status")) {
                                    String[] parts = destination.split("/");
                                    if (parts.length > 3) {
                                        try {
                                            Long attemptId = Long.parseLong(parts[3]);
                                            ExamAttempt attempt = examAttemptRepository.findById(attemptId).orElse(null);
                                            if (attempt == null) {
                                                throw new AccessDeniedException("Exam attempt not found");
                                            }
                                            // Enforce strict student ownership check
                                            if (!attempt.getStudent().getId().equals(user.getId()) 
                                                    && user.getRole() != UserRole.ADMIN 
                                                    && user.getRole() != UserRole.SUPER_ADMIN) {
                                                throw new AccessDeniedException("Unauthorized subscription: You do not own this attempt");
                                            }
                                        } catch (NumberFormatException e) {
                                            throw new AccessDeniedException("Invalid attempt ID in subscription path");
                                        }
                                    }
                                }
                            }
                        } else {
                            throw new AccessDeniedException("Unauthenticated subscription request");
                        }
                    }
                }
                
                return message;
            }
        };
    }

    /**
     * Copies Spring Security CSRF token from HttpServletRequest attributes 
     * to WebSocket session attributes during HTTP Upgrade handshake.
     */
    private static class CsrfHandshakeInterceptor implements HandshakeInterceptor {
        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                jakarta.servlet.http.HttpServletRequest req = servletRequest.getServletRequest();
                CsrfToken csrfToken = (CsrfToken) req.getAttribute(CsrfToken.class.getName());
                if (csrfToken != null) {
                    attributes.put("CSRF_TOKEN", csrfToken);
                }
            }
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Exception exception) {
        }
    }
}
