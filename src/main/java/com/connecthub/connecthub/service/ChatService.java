package com.connecthub.connecthub.service;

import com.connecthub.connecthub.model.Conversation;
import com.connecthub.connecthub.model.Message;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.repository.ConversationRepository;
import com.connecthub.connecthub.repository.FollowerRepository;
import com.connecthub.connecthub.repository.MessageRepository;
import com.connecthub.connecthub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FollowerRepository followerRepository;

    @Value("${connecthub.chat.upload-dir:./uploads/chat/}")
    private String CHAT_MEDIA_DIR;

    public ChatService(ConversationRepository conversationRepository,
                       MessageRepository messageRepository,
                       UserRepository userRepository,
                       FollowerRepository followerRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.followerRepository = followerRepository;
    }

    // =============================
    // GET OR CREATE CONVERSATION
    // =============================
    public Conversation getConversation(String myEmail, String otherUserEmail) {
        return conversationRepository
                .findByUser1EmailAndUser2Email(myEmail, otherUserEmail)
                .or(() -> conversationRepository.findByUser2EmailAndUser1Email(myEmail, otherUserEmail))
                .orElseGet(() -> {
                    Conversation c = new Conversation();
                    c.setUser1Email(myEmail);
                    c.setUser2Email(otherUserEmail);
                    c.setCreatedAt(LocalDateTime.now()); // ✅ now works
                    return conversationRepository.save(c);
                });
    }

    // =============================
    // SEND MESSAGE
    // =============================
    public Message sendMessage(String myEmail,
                               String receiverEmail,
                               String content,
                               MultipartFile file) {
        User sender = userRepository.findByEmail(myEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Enforce follow check for private accounts (or if requested, all accounts)
        // User requested: "why u cant text them ,since u didnt follow them"
        // This implies strict following rules. Let's enforce it for private accounts strictly.
        if (receiver.isPrivate()) {
            boolean isAccepted = followerRepository
                    .findByFollowerIdAndFollowingId(sender.getId(), receiver.getId())
                    .map(f -> "ACCEPTED".equals(f.getStatus()))
                    .orElse(false);
            
            if (!isAccepted && !sender.getId().equals(receiver.getId())) {
                throw new RuntimeException("You cannot message this user because their account is private and you are not following them.");
            }
        }

        Conversation conversation = getConversation(myEmail, receiverEmail);

        String mediaUrl = null;
        try {
            if (file != null && !file.isEmpty()) {
                Path uploadPath = Paths.get(CHAT_MEDIA_DIR);
                Files.createDirectories(uploadPath);

                String original = file.getOriginalFilename();
                String ext = "";

                if (original != null && original.contains(".")) {
                    ext = original.substring(original.lastIndexOf("."));
                }

                String fileName = UUID.randomUUID() + ext;
                Path filePath = uploadPath.resolve(fileName);

                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                mediaUrl = "/uploads/chat/" + fileName;
            }
        } catch (Exception e) {
            throw new RuntimeException("File upload failed", e);
        }

        Message message = new Message();
        message.setConversationId(conversation.getId());
        message.setSenderEmail(myEmail);
        message.setContent(content);
        message.setMediaUrl(mediaUrl);
        message.setRead(false);
        message.setCreatedAt(LocalDateTime.now());

        return messageRepository.save(message);
    }

    // =============================
    // GET MESSAGES
    // =============================
    public List<Message> getMessages(Long conversationId) {
        List<Message> messages = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId);

        // Mark messages as read
        messages.stream()
                .filter(m -> !m.isRead())
                .forEach(m -> {
                    m.setRead(true);
                    messageRepository.save(m);
                });

        return messages;
    }

    // =============================
    // UNREAD COUNT
    // =============================
    public long getUnreadCount(Long conversationId) {
        return messageRepository.countByConversationIdAndSenderEmailNotAndReadFalse(conversationId, null);
    }
}
