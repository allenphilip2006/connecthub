package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, Long> {
    List<StoryView> findByStoryId(Long storyId);
    boolean existsByStoryIdAndViewerEmail(Long storyId, String viewerEmail);
    java.util.Optional<StoryView> findByStoryIdAndViewerEmail(Long storyId, String viewerEmail);
    java.util.Optional<StoryView> findByStoryIdAndViewerEmailAndSlideId(Long storyId, String viewerEmail, String slideId);

    List<StoryView> findByStoryIdIn(Collection<Long> storyIds);
}
