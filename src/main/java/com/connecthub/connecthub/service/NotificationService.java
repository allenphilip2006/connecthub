package com.connecthub.connecthub.service;

import com.connecthub.connecthub.model.Notification;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.repository.NotificationRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository repository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void createNotification(
            String recipient,
            String sender,
            String type,
            Long postId) {
        if (recipient == null || recipient.equals(sender))
            return;
        if (sender == null)
            return;

        Optional<User> senderOpt = userRepository.findByEmail(sender);
        Long senderId = senderOpt.map(User::getId).orElse(null);

        Notification n = new Notification();
        n.setRecipientEmail(recipient);
        n.setSenderEmail(sender);
        n.setType(type);
        n.setPostId(postId);
        n.setSenderId(senderId);
        repository.save(n);

        try {
            messagingTemplate.convertAndSendToUser(
                    recipient,
                    "/queue/notifications",
                    n);
        } catch (Exception e) {
            System.err.println("WS notification send failed: " + e.getMessage());
        }

        sendPushNotificationAsync(recipient, n);
    }

    @Async
    public void sendPushNotificationAsync(String recipientEmail, Notification n) {
        userRepository.findByEmail(recipientEmail).ifPresent(user -> {
            if (!user.isNotificationsEnabled()) return;
            if (user.getFcmToken() == null || user.getFcmToken().isBlank()) return;

            String title = "ConnectHub";
            String body = buildBody(n);

            try {
                Message message = Message.builder()
                        .setToken(user.getFcmToken())
                        .setNotification(com.google.firebase.messaging.Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .putData("type", n.getType() != null ? n.getType() : "")
                        .putData("senderEmail", n.getSenderEmail() != null ? n.getSenderEmail() : "")
                        .putData("postId", n.getPostId() != null ? String.valueOf(n.getPostId()) : "")
                        .build();
                FirebaseMessaging.getInstance().send(message);
            } catch (Exception e) {
                System.err.println("FCM send failed: " + e.getMessage());
            }
        });
    }

    private String buildBody(Notification n) {
        String sender = n.getSenderEmail() != null ? n.getSenderEmail() : "Someone";
        int at = sender.indexOf('@');
        String display = at > 0 ? sender.substring(0, at) : sender;
        return switch (n.getType() != null ? n.getType() : "") {
            case "FOLLOW" -> display + " started following you";
            case "LIKE" -> display + " liked your post";
            case "COMMENT" -> display + " commented on your post";
            case "MENTION" -> display + " mentioned you";
            case "TAG" -> display + " tagged you in a post";
            case "MESSAGE" -> "New message from " + display;
            default -> "You have a new update";
        };
    }

    public void sendTestNotification(String email) {
        Notification n = new Notification();
        n.setRecipientEmail(email);
        n.setSenderEmail("system@connecthub.com");
        n.setType("TEST");
        sendPushNotificationAsync(email, n);
    }

    @Transactional(readOnly = true)
    public List<Notification> getMyNotifications(String email) {
        return repository.findByRecipientEmailOrderByCreatedAtDesc(email);
    }

    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        return repository.countByRecipientEmailAndReadFalse(email);
    }

    @Transactional
    public void markRead(Long id) {
        repository.findById(id).ifPresent(n -> {
            n.setRead(true);
            repository.save(n);
        });
    }
}
