package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.StoryComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface StoryCommentRepository extends JpaRepository<StoryComment, Long> {
    List<StoryComment> findByStoryIdOrderByCreatedAtAsc(Long storyId);
    void deleteByIdAndUserEmail(Long id, String userEmail);

    List<StoryComment> findByStoryIdInOrderByCreatedAtAsc(Collection<Long> storyIds);
}
