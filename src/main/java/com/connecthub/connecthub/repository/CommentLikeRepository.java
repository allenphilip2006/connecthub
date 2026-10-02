package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    Optional<CommentLike> findByCommentIdAndUserEmail(Long commentId, String userEmail);

    boolean existsByCommentIdAndUserEmail(Long commentId, String userEmail);

    void deleteByCommentIdAndUserEmail(Long commentId, String userEmail);

    @Query("SELECT cl.commentId FROM CommentLike cl WHERE cl.userEmail = :email AND cl.commentId IN :commentIds")
    List<Long> findLikedCommentIds(@Param("email") String email, @Param("commentIds") Collection<Long> commentIds);
}
