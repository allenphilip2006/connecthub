package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.SavedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    Optional<SavedPost> findByUserEmailAndPostId(String userEmail, Long postId);
    List<SavedPost> findByUserEmailOrderBySavedAtDesc(String userEmail);
}
