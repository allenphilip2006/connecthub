package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String email);

    long countByRecipientEmailAndReadFalse(String email);
}
