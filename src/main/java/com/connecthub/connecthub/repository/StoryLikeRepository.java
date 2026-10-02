package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.StoryLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public interface StoryLikeRepository extends JpaRepository<StoryLike, Long> {
    List<StoryLike> findByStoryId(Long storyId);
    Optional<StoryLike> findByStoryIdAndUserEmail(Long storyId, String userEmail);
    void deleteByStoryIdAndUserEmail(Long storyId, String userEmail);
    int countByStoryId(Long storyId);

    @Query("SELECT sl.storyId, COUNT(sl) FROM StoryLike sl WHERE sl.storyId IN :ids GROUP BY sl.storyId")
    List<Object[]> countByStoryIdIn(@Param("ids") Collection<Long> ids);

    @Query("SELECT sl.storyId FROM StoryLike sl WHERE sl.userEmail = :email AND sl.storyId IN :ids")
    List<Long> findLikedStoryIds(@Param("email") String email, @Param("ids") Collection<Long> ids);

    default Map<Long, Long> countMapByStoryIds(Collection<Long> ids) {
        return countByStoryIdIn(ids).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
    }
}
