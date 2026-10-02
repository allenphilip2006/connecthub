package com.connecthub.connecthub.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    public WebSocketAuthChannelInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {

                String token = authHeader.substring(7);

                if (jwtUtil.validateToken(token)) {

                    String email = jwtUtil.extractUsername(token);

                    accessor.setUser(new Principal() {
                        @Override
                        public String getName() {
                            return email;
                        }
                    });

                    System.out.println("✅ WebSocket Authenticated: " + email);
                } else {
                    System.out.println("❌ Invalid JWT in WebSocket");
                }
            } else {
                System.out.println("❌ No Authorization header in WebSocket");
            }
        }

        return message;
    }
}
