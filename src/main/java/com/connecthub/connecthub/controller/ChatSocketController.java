package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.ChatMessage;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.repository.ChatMessageRepository;
import com.connecthub.connecthub.repository.FollowerRepository;
import com.connecthub.connecthub.repository.UserRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class ChatSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatRepo;
    private final UserRepository userRepository;
    private final FollowerRepository followerRepository;
    private final Map<String, CachedUser> userCache = new ConcurrentHashMap<>();

    private static final long CACHE_TTL_MS = 30_000L;

    private static final class CachedUser {
        final Long id;
        final boolean isPrivate;
        final long timestamp;
        CachedUser(Long id, boolean isPrivate, long timestamp) {
            this.id = id;
            this.isPrivate = isPrivate;
            this.timestamp = timestamp;
        }
    }

    public ChatSocketController(SimpMessagingTemplate messagingTemplate,
            ChatMessageRepository chatRepo,
            UserRepository userRepository,
            FollowerRepository followerRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatRepo = chatRepo;
        this.userRepository = userRepository;
        this.followerRepository = followerRepository;
    }

    private CachedUser getCached(String email) {
        CachedUser c = userCache.get(email);
        long now = System.currentTimeMillis();
        if (c != null && (now - c.timestamp) < CACHE_TTL_MS) {
            return c;
        }
        User u = userRepository.findByEmail(email).orElse(null);
        if (u == null) return null;
        CachedUser nc = new CachedUser(u.getId(), u.isPrivate(), now);
        userCache.put(email, nc);
        return nc;
    }

    @MessageMapping("/chat.send")
    @Transactional
    public void send(ChatMessage message, Principal principal) {
        if (principal == null) return;
        String senderEmail = principal.getName();
        String receiverEmail = message.getReceiver();
        String content = message.getContent();

        if (receiverEmail == null || receiverEmail.isBlank()) return;
        if (senderEmail.equals(receiverEmail)) return;
        if (content == null || content.isBlank() || content.length() > 4000) return;

        CachedUser sender = getCached(senderEmail);
        CachedUser receiver = getCached(receiverEmail);

        if (sender == null || receiver == null) return;

        if (receiver.isPrivate) {
            boolean isFollowing = followerRepository
                    .findByFollowerIdAndFollowingId(sender.id, receiver.id)
                    .map(f -> "ACCEPTED".equals(f.getStatus()))
                    .orElse(false);
            if (!isFollowing) return;
        }

        ChatMessage savedMessage = new ChatMessage(senderEmail, receiverEmail, content.trim());
        if (savedMessage.getTimestamp() == null) {
            savedMessage.setTimestamp(LocalDateTime.now());
        }
        chatRepo.save(savedMessage);

        try {
            messagingTemplate.convertAndSendToUser(
                    receiverEmail,
                    "/queue/messages",
                    savedMessage);
        } catch (Exception e) {
            System.err.println("WS chat send failed to " + receiverEmail + ": " + e.getMessage());
        }
    }
}
