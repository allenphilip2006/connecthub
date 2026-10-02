package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    // Count unread messages for a conversation
    long countByConversationIdAndSenderEmailNotAndReadFalse(Long conversationId, String senderEmail);
}
