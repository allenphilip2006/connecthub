package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByAuthorEmailAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtDesc(String authorEmail, LocalDateTime now);
    Page<Story> findByAuthorEmailInAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtDesc(Collection<String> emails, LocalDateTime now, Pageable pageable);
    Page<Story> findByAudienceAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtDesc(String audience, LocalDateTime now, Pageable pageable);
}
