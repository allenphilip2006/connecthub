package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

        // 🔹 Feed – followed users
        Page<Post> findByAuthorEmailInAndDeletedFalseAndArchivedFalse(
                        List<String> emails,
                        Pageable pageable);

        // 🔹 Feed – popular / recommended
        Page<Post> findByDeletedFalseAndArchivedFalseOrderByLikeCountDescCreatedAtDesc(
                        Pageable pageable);

        // 🔹 My posts (All including archived)
        Page<Post> findByAuthorEmailAndDeletedFalse(
                        String email,
                        Pageable pageable);

        // 🔹 Public profile posts (Excluding archived)
        Page<Post> findByAuthorEmailAndDeletedFalseAndArchivedFalse(
                        String email,
                        Pageable pageable);

        // 🔹 Simple feed
        Page<Post> findByDeletedFalseAndArchivedFalse(Pageable pageable);
}
