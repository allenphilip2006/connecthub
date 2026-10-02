package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByUser1EmailAndUser2Email(
            String user1Email, String user2Email
    );

    Optional<Conversation> findByUser2EmailAndUser1Email(
            String user1Email, String user2Email
    );
}
