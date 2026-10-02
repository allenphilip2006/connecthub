package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.Conversation;
import com.connecthub.connecthub.model.Message;
import com.connecthub.connecthub.service.ChatService;
import com.connecthub.connecthub.service.NotificationService;
import com.connecthub.connecthub.dto.TypingDTO;
//import jakarta.servlet.http.HttpServletRequest;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    public ChatController(ChatService chatService,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
    }

    // ---------------- SEND MESSAGE ----------------
    @PostMapping(value = "/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> sendMessage(@RequestParam String receiverEmail,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file) {
        String myEmail = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (myEmail == null)
            return ResponseEntity.status(401).build();

        Message saved;
        try {
            saved = chatService.sendMessage(myEmail, receiverEmail, content, file);
        } catch (RuntimeException ex) {
            String message = ex.getMessage() == null ? "" : ex.getMessage();
            if (message.contains("Unauthorized") || message.contains("You cannot message")) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", message));
            }
            return ResponseEntity.status(404).build();
        }

        // Send to receiver
        messagingTemplate.convertAndSendToUser(receiverEmail, "/queue/messages", saved);
        messagingTemplate.convertAndSendToUser(saved.getSenderEmail(), "/queue/messages", saved);
        notificationService.createNotification(receiverEmail, myEmail, "MESSAGE", null);

        return ResponseEntity.ok(saved);
    }

    // ---------------- SHARE (permitted regardless of follow) ----------------
    @PostMapping(value = "/share", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> share(@RequestBody java.util.Map<String, String> body) {
        String myEmail = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (myEmail == null)
            return ResponseEntity.status(401).build();
        String receiverEmail = body.get("receiverEmail");
        String link = body.get("link");
        if (receiverEmail == null || receiverEmail.isBlank() || link == null || link.isBlank())
            return ResponseEntity.badRequest().build();
        try {
            // Notify receiver; avoid strict privacy gate by sending notification
            notificationService.createNotification(receiverEmail, myEmail, "MESSAGE", null);
            // Return ok with simple payload
            return ResponseEntity.ok(java.util.Map.of("status", "shared"));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Share failed"));
        }
    }

    // ---------------- TYPING ----------------
    @MessageMapping("/chat.typing")
    public void typing(TypingDTO typingDTO) {
        messagingTemplate.convertAndSendToUser(typingDTO.getReceiver(), "/queue/typing", typingDTO);
    }

    // ---------------- CHAT HISTORY ----------------
    @GetMapping("/history")
    public List<Message> getHistory(@RequestParam String otherUserEmail) {
        String myEmail = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

        if (myEmail == null || myEmail.isBlank())
            return List.of();
        if (otherUserEmail == null || otherUserEmail.isBlank())
            return List.of();

        Conversation conversation = chatService.getConversation(myEmail, otherUserEmail);
        if (conversation == null)
            return List.of();

        return chatService.getMessages(conversation.getId());
    }

    // ---------------- UNREAD COUNT ----------------
    @GetMapping("/unread/{conversationId}")
    public long unreadCount(@PathVariable Long conversationId) {
        return chatService.getUnreadCount(conversationId);
    }
}
