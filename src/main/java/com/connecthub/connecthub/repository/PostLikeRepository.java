package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    Optional<PostLike> findByUserEmailAndPostId(String userEmail, Long postId);

    long countByPostId(Long postId);

    @Query("SELECT pl.postId FROM PostLike pl WHERE pl.userEmail = :email AND pl.postId IN :postIds")
    List<Long> findLikedPostIdsByUserEmailAndPostIdIn(@Param("email") String userEmail, @Param("postIds") Collection<Long> postIds);

    @Query("SELECT pl.postId, COUNT(pl) FROM PostLike pl WHERE pl.postId IN :postIds GROUP BY pl.postId")
    List<Object[]> countByPostIdIn(@Param("postIds") Collection<Long> postIds);

    default Map<Long, Long> countMapByPostIds(Collection<Long> postIds) {
        return countByPostIdIn(postIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
    }
}
