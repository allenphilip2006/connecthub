package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.Follower;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public interface FollowerRepository extends JpaRepository<Follower, Long> {

    List<Follower> findByFollowerIdAndStatus(Long followerId, String status);

    List<Follower> findByFollowingIdAndStatus(Long followingId, String status);

    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    void deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);

    java.util.Optional<Follower> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    long countByFollowingId(Long followingId);

    long countByFollowerId(Long followerId);

    @Query("SELECT f.followingId FROM Follower f WHERE f.followerId = :followerId AND f.status = 'ACCEPTED'")
    Set<Long> findFollowingIdsByFollowerId(@Param("followerId") Long followerId);

    @Query("SELECT f.followingId, COUNT(f) FROM Follower f WHERE f.status='ACCEPTED' AND f.followingId IN :ids GROUP BY f.followingId")
    List<Object[]> countFollowersByFollowingIds(@Param("ids") Collection<Long> ids);

    @Query("SELECT f.followerId, COUNT(f) FROM Follower f WHERE f.status='ACCEPTED' AND f.followerId IN :ids GROUP BY f.followerId")
    List<Object[]> countFollowingByFollowerIds(@Param("ids") Collection<Long> ids);

    List<Follower> findByFollowerIdAndFollowingIdIn(Long followerId, Collection<Long> followingIds);

    default Map<Long, Long> countFollowerMapByIds(Collection<Long> followingIds) {
        return countFollowersByFollowingIds(followingIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
    }

    default Map<Long, Long> countFollowingMapByIds(Collection<Long> followerIds) {
        return countFollowingByFollowerIds(followerIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
    }
}
