package com.connecthub.connecthub.service;

import com.connecthub.connecthub.dto.StoryCommentResponse;
import com.connecthub.connecthub.dto.StoryResponse;
import com.connecthub.connecthub.dto.StoryViewResponse;
import com.connecthub.connecthub.dto.UserSummary;
import com.connecthub.connecthub.model.Story;
import com.connecthub.connecthub.model.StoryComment;
import com.connecthub.connecthub.model.StoryLike;
import com.connecthub.connecthub.model.StoryView;
import com.connecthub.connecthub.model.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.connecthub.connecthub.repository.FollowerRepository;
import com.connecthub.connecthub.repository.StoryCommentRepository;
import com.connecthub.connecthub.repository.StoryLikeRepository;
import com.connecthub.connecthub.repository.StoryRepository;
import com.connecthub.connecthub.repository.StoryViewRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StoryService {
    private static final String STORY_DIR = "C:/connecthub/uploads/story/";
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final FollowerRepository followerRepository;
    private final StoryViewRepository storyViewRepository;
    private final StoryLikeRepository storyLikeRepository;
    private final StoryCommentRepository storyCommentRepository;
    private final ObjectMapper objectMapper;

    public StoryService(StoryRepository storyRepository,
                        UserRepository userRepository,
                        FollowerRepository followerRepository,
                        StoryViewRepository storyViewRepository,
                        StoryLikeRepository storyLikeRepository,
                        StoryCommentRepository storyCommentRepository,
                        ObjectMapper objectMapper) {
        this.storyRepository = storyRepository;
        this.userRepository = userRepository;
        this.followerRepository = followerRepository;
        this.storyViewRepository = storyViewRepository;
        this.storyLikeRepository = storyLikeRepository;
        this.storyCommentRepository = storyCommentRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public StoryResponse create(String authorEmail, String caption, String captionPosition, String audience, Double mediaScale, String recipients, String music, MultipartFile file, MultipartFile[] files, String slidesMetaJson) {
        try {
            Files.createDirectories(Paths.get(STORY_DIR));
            String mediaUrl = null;
            List<Map<String, Object>> slides = new ArrayList<>();
            List<Map<String, Object>> providedMeta = new ArrayList<>();
            if (slidesMetaJson != null && !slidesMetaJson.isBlank()) {
                try {
                    providedMeta = objectMapper.readValue(slidesMetaJson, new TypeReference<List<Map<String,Object>>>(){});
                } catch (Exception ignore) { providedMeta = new ArrayList<>(); }
            }
            if (files != null && files.length > 0) {
                for (MultipartFile f : files) {
                    if (f == null || f.isEmpty()) continue;
                    String originalName = f.getOriginalFilename();
                    String extension = "";
                    if (originalName != null && originalName.contains(".")) {
                        extension = originalName.substring(originalName.lastIndexOf("."));
                    }
                    String fileName = UUID.randomUUID() + extension;
                    Path filePath = Paths.get(STORY_DIR).resolve(fileName);
                    Files.copy(f.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    String url = "/uploads/story/" + fileName;
                    if (mediaUrl == null) mediaUrl = url;
                    String lower = extension.toLowerCase();
                    String type = (lower.endsWith("mp4") || lower.endsWith("webm") || lower.endsWith("ogg")) ? "video" : "image";
                    Map<String, Object> slide = new HashMap<>();
                    slide.put("slideId", UUID.randomUUID().toString());
                    slide.put("mediaUrl", url);
                    slide.put("mediaType", type);
                    Map<String, Object> meta = null;
                    int idx = slides.size();
                    if (providedMeta.size() > idx) {
                        meta = providedMeta.get(idx);
                    }
                    if (meta != null) {
                        slide.put("captionPosition", meta.getOrDefault("position", captionPosition));
                        slide.put("captionText", meta.getOrDefault("text", caption));
                    } else {
                        slide.put("captionPosition", captionPosition);
                        slide.put("captionText", caption);
                    }
                    slide.put("stickers", new ArrayList<>());
                    slide.put("duration", type.equals("image") ? 5 : 0);
                    slide.put("filter", "");
                    slide.put("createdAt", Instant.now().toString());
                    slides.add(slide);
                }
            }
            if (file != null && !file.isEmpty() && slides.isEmpty()) {
                String originalName = file.getOriginalFilename();
                String extension = "";
                if (originalName != null && originalName.contains(".")) {
                    extension = originalName.substring(originalName.lastIndexOf("."));
                }
                String fileName = UUID.randomUUID() + extension;
                Path filePath = Paths.get(STORY_DIR).resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                mediaUrl = "/uploads/story/" + fileName;
                String lower = extension.toLowerCase();
                String type = (lower.endsWith("mp4") || lower.endsWith("webm") || lower.endsWith("ogg")) ? "video" : "image";
                Map<String, Object> slide = new HashMap<>();
                slide.put("slideId", UUID.randomUUID().toString());
                slide.put("mediaUrl", mediaUrl);
                slide.put("mediaType", type);
                slide.put("captionPosition", captionPosition);
                slide.put("captionText", caption);
                slide.put("stickers", new ArrayList<>());
                slide.put("duration", type.equals("image") ? 5 : 0);
                slide.put("filter", "");
                slide.put("createdAt", Instant.now().toString());
                slides.add(slide);
            }

            Story story = new Story();
            story.setAuthorEmail(authorEmail);
            story.setCaption(caption);
            story.setCaptionPosition(captionPosition);
            story.setAudience(audience == null ? "FOLLOWERS" : audience.toUpperCase());
            if (mediaScale != null) {
                story.setMediaScale(mediaScale);
            }
            story.setRecipients(recipients);
            story.setMusic(music);
            story.setMediaUrl(mediaUrl);
            if (!slides.isEmpty()) {
                story.setSlidesJson(objectMapper.writeValueAsString(slides));
            }
            story.setCreatedAt(LocalDateTime.now());
            story.setExpiresAt(LocalDateTime.now().plusHours(24));
            Story saved = storyRepository.save(story);
            return mapAllToResponse(List.of(saved), authorEmail).get(0);
        } catch (Exception e) {
            throw new RuntimeException("Story upload failed: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> myStories(String email) {
        List<Story> stories = storyRepository.findByAuthorEmailAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtDesc(email, LocalDateTime.now());
        return mapAllToResponse(stories, email);
    }

    @Transactional(readOnly = true)
    public Page<StoryResponse> feed(String email, int page, int size) {
        User me = userRepository.findByEmail(email).orElse(null);
        Set<String> allowedEmails = new HashSet<>();
        if (me != null) {
            Set<Long> followingIds = followerRepository.findFollowingIdsByFollowerId(me.getId());
            if (!followingIds.isEmpty()) {
                Map<Long, User> followingUsers = userRepository.mapById(followingIds);
                for (User u : followingUsers.values()) {
                    allowedEmails.add(u.getEmail());
                }
            }
        }

        List<Story> publicStories = storyRepository
                .findByAudienceAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtDesc("PUBLIC", LocalDateTime.now(), Pageable.unpaged())
                .getContent();

        List<Story> followedStories = storyRepository
                .findByAuthorEmailInAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtDesc(allowedEmails, LocalDateTime.now(), Pageable.unpaged())
                .getContent();

        List<Story> closeFriendsStories = storyRepository
                .findByAudienceAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtDesc("CLOSE_FRIENDS", LocalDateTime.now(), Pageable.unpaged())
                .getContent()
                .stream()
                .filter(story -> parseRecipients(story.getRecipients()).contains(email))
                .collect(Collectors.toList());

        List<Story> allStories = new ArrayList<>();
        allStories.addAll(publicStories);
        allStories.addAll(followedStories);
        allStories.addAll(closeFriendsStories);

        List<Story> distinctStories = allStories.stream()
                .distinct()
                .sorted((s1, s2) -> s2.getCreatedAt().compareTo(s1.getCreatedAt()))
                .collect(Collectors.toList());

        int start = page * size;
        int end = Math.min(start + size, distinctStories.size());
        List<Story> pageStories = start < distinctStories.size() ? distinctStories.subList(start, end) : Collections.emptyList();
        List<StoryResponse> paginatedStories = mapAllToResponse(pageStories, email);

        return new org.springframework.data.domain.PageImpl<>(paginatedStories, PageRequest.of(page, size), distinctStories.size());
    }

    @Transactional
    public StoryResponse update(Long id, String email, String caption, String captionPosition, String audience, Double mediaScale, String recipients, String music, String slides) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new RuntimeException("Story not found"));
        if (!story.getAuthorEmail().equals(email)) throw new RuntimeException("Unauthorized");
        if (caption != null) story.setCaption(caption);
        if (captionPosition != null) story.setCaptionPosition(captionPosition);
        if (audience != null) story.setAudience(audience.toUpperCase());
        if (mediaScale != null) story.setMediaScale(mediaScale);
        if (recipients != null) story.setRecipients(recipients);
        if (music != null) story.setMusic(music);
        if (slides != null) story.setSlidesJson(slides);
        Story saved = storyRepository.save(story);
        return mapAllToResponse(List.of(saved), email).get(0);
    }

    @Transactional(readOnly = true)
    public StoryResponse getById(Long id) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new RuntimeException("Story not found"));
        String currentUserEmail = SecurityUtils.getCurrentUserEmail().orElse(null);
        return mapAllToResponse(List.of(story), currentUserEmail).get(0);
    }

    @Transactional
    public void delete(Long id, String email) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new RuntimeException("Story not found"));
        if (!story.getAuthorEmail().equals(email)) throw new RuntimeException("Unauthorized");
        story.setDeleted(true);
        storyRepository.save(story);
    }

    @Transactional
    public void recordView(Long storyId, String viewerEmail) {
        StoryView existing = storyViewRepository.findByStoryIdAndViewerEmail(storyId, viewerEmail).orElse(null);
        if (existing == null) {
            StoryView storyView = new StoryView(storyId, viewerEmail);
            storyView.setViewedAt(LocalDateTime.now());
            storyView.setCount(1);
            storyViewRepository.save(storyView);
        } else {
            existing.setCount(existing.getCount() + 1);
            existing.setViewedAt(LocalDateTime.now());
            storyViewRepository.save(existing);
        }
    }

    @Transactional
    public void recordSlideView(Long storyId, String slideId, String viewerEmail) {
        if (slideId == null || slideId.isBlank()) {
            recordView(storyId, viewerEmail);
            return;
        }
        StoryView existing = storyViewRepository.findByStoryIdAndViewerEmailAndSlideId(storyId, viewerEmail, slideId).orElse(null);
        if (existing == null) {
            StoryView storyView = new StoryView(storyId, viewerEmail);
            storyView.setSlideId(slideId);
            storyView.setViewedAt(LocalDateTime.now());
            storyView.setCount(1);
            storyViewRepository.save(storyView);
        } else {
            existing.setCount(existing.getCount() + 1);
            existing.setViewedAt(LocalDateTime.now());
            storyViewRepository.save(existing);
        }
    }

    @Transactional
    public void likeStory(Long storyId, String userEmail) {
        storyRepository.findById(storyId).orElseThrow(() -> new RuntimeException("Story not found"));
        if (storyLikeRepository.findByStoryIdAndUserEmail(storyId, userEmail).isEmpty()) {
            storyLikeRepository.save(new StoryLike(storyId, userEmail));
        }
    }

    @Transactional
    public void unlikeStory(Long storyId, String userEmail) {
        storyRepository.findById(storyId).orElseThrow(() -> new RuntimeException("Story not found"));
        storyLikeRepository.deleteByStoryIdAndUserEmail(storyId, userEmail);
    }

    @Transactional
    public StoryComment addComment(Long storyId, String userEmail, String content) {
        storyRepository.findById(storyId).orElseThrow(() -> new RuntimeException("Story not found"));
        StoryComment comment = new StoryComment(storyId, userEmail, content);
        return storyCommentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, String userEmail) {
        storyCommentRepository.deleteByIdAndUserEmail(commentId, userEmail);
    }

    public List<StoryResponse> mapAllToResponse(List<Story> stories, String currentUserEmail) {
        if (stories == null || stories.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> storyIds = stories.stream()
                .map(Story::getId)
                .collect(Collectors.toSet());

        Set<String> authorEmails = stories.stream()
                .map(Story::getAuthorEmail)
                .collect(Collectors.toSet());
        Map<String, User> authorUserMap = userRepository.mapByEmail(authorEmails);

        List<StoryView> allViews = storyViewRepository.findByStoryIdIn(storyIds);
        Map<Long, List<StoryView>> viewsByStoryId = allViews.stream()
                .collect(Collectors.groupingBy(StoryView::getStoryId));

        Set<String> viewerEmails = allViews.stream()
                .map(StoryView::getViewerEmail)
                .collect(Collectors.toSet());
        Map<String, User> viewerUserMap = userRepository.mapByEmail(viewerEmails);

        Map<Long, Long> likeCounts = storyLikeRepository.countMapByStoryIds(storyIds);

        Set<Long> likedByMeIds = new HashSet<>();
        if (currentUserEmail != null) {
            likedByMeIds = new HashSet<>(storyLikeRepository.findLikedStoryIds(currentUserEmail, storyIds));
        }

        List<StoryComment> allComments = storyCommentRepository.findByStoryIdInOrderByCreatedAtAsc(storyIds);
        Map<Long, List<StoryComment>> commentsByStoryId = allComments.stream()
                .collect(Collectors.groupingBy(StoryComment::getStoryId));

        Set<String> commenterEmails = allComments.stream()
                .map(StoryComment::getUserEmail)
                .collect(Collectors.toSet());
        Map<String, User> commenterUserMap = userRepository.mapByEmail(commenterEmails);

        List<StoryResponse> result = new ArrayList<>(stories.size());
        for (Story story : stories) {
            StoryResponse r = new StoryResponse();
            r.setId(story.getId());
            r.setMediaUrl(story.getMediaUrl());
            r.setCaption(story.getCaption());
            r.setCaptionPosition(story.getCaptionPosition());
            r.setAudience(story.getAudience());
            r.setMediaScale(story.getMediaScale());
            r.setRecipients(story.getRecipients());
            r.setMusic(story.getMusic());
            r.setSlides(story.getSlidesJson());
            r.setCreatedAt(story.getCreatedAt());
            r.setExpiresAt(story.getExpiresAt());

            User u = authorUserMap.get(story.getAuthorEmail());
            if (u != null) {
                UserSummary s = new UserSummary();
                s.setId(u.getId());
                s.setUsername(u.getUsername());
                s.setEmail(u.getEmail());
                s.setProfileImage(u.getProfileImage());
                r.setUser(s);
            }

            List<StoryView> views = viewsByStoryId.getOrDefault(story.getId(), Collections.emptyList());
            int totalCount = views.stream().mapToInt(StoryView::getCount).sum();
            r.setViewCount(totalCount);

            List<StoryViewResponse> viewDetails = views.stream()
                    .map(view -> {
                        StoryViewResponse svr = new StoryViewResponse();
                        svr.setSlideId(view.getSlideId());
                        svr.setCount(view.getCount());
                        svr.setViewedAt(view.getViewedAt());
                        User viewerU = viewerUserMap.get(view.getViewerEmail());
                        if (viewerU != null) {
                            UserSummary s = new UserSummary();
                            s.setId(viewerU.getId());
                            s.setUsername(viewerU.getUsername());
                            s.setEmail(viewerU.getEmail());
                            s.setProfileImage(viewerU.getProfileImage());
                            svr.setUser(s);
                        }
                        return svr;
                    })
                    .filter(svr -> svr.getUser() != null)
                    .collect(Collectors.toList());
            r.setViewDetails(viewDetails);

            Map<String, int[]> viewerStats = new HashMap<>();
            Map<String, LocalDateTime> viewerLastViewed = new HashMap<>();
            for (StoryView v : views) {
                String ve = v.getViewerEmail();
                viewerStats.merge(ve, new int[]{v.getCount()}, (a, b) -> { a[0] += b[0]; return a; });
                LocalDateTime prev = viewerLastViewed.get(ve);
                if (prev == null || v.getViewedAt().isAfter(prev)) {
                    viewerLastViewed.put(ve, v.getViewedAt());
                }
            }
            List<User> uniqueViewers = new ArrayList<>();
            for (String ve : viewerEmails) {
                User vu = viewerUserMap.get(ve);
                if (vu != null) uniqueViewers.add(vu);
            }
            uniqueViewers.sort((a, b) -> {
                int[] ca = viewerStats.get(a.getEmail());
                int[] cb = viewerStats.get(b.getEmail());
                int ia = ca != null ? ca[0] : 0;
                int ib = cb != null ? cb[0] : 0;
                int cmp = Integer.compare(ib, ia);
                if (cmp != 0) return cmp;
                LocalDateTime ta = viewerLastViewed.getOrDefault(a.getEmail(), LocalDateTime.MIN);
                LocalDateTime tb = viewerLastViewed.getOrDefault(b.getEmail(), LocalDateTime.MIN);
                return tb.compareTo(ta);
            });
            List<UserSummary> viewers = uniqueViewers.stream()
                    .map(viewerUser -> {
                        UserSummary viewerSummary = new UserSummary();
                        viewerSummary.setId(viewerUser.getId());
                        viewerSummary.setUsername(viewerUser.getUsername());
                        viewerSummary.setEmail(viewerUser.getEmail());
                        viewerSummary.setProfileImage(viewerUser.getProfileImage());
                        return viewerSummary;
                    })
                    .collect(Collectors.toList());
            r.setViewers(viewers);

            r.setLikeCount(likeCounts.getOrDefault(story.getId(), 0L).intValue());
            r.setLikedByMe(currentUserEmail != null && likedByMeIds.contains(story.getId()));

            List<StoryCommentResponse> commentResponses = commentsByStoryId.getOrDefault(story.getId(), Collections.emptyList())
                    .stream()
                    .map(comment -> {
                        StoryCommentResponse commentResponse = new StoryCommentResponse();
                        commentResponse.setId(comment.getId());
                        commentResponse.setContent(comment.getContent());
                        commentResponse.setCreatedAt(comment.getCreatedAt());
                        User commentAuthor = commenterUserMap.get(comment.getUserEmail());
                        if (commentAuthor != null) {
                            UserSummary commentAuthorSummary = new UserSummary();
                            commentAuthorSummary.setId(commentAuthor.getId());
                            commentAuthorSummary.setUsername(commentAuthor.getUsername());
                            commentAuthorSummary.setEmail(commentAuthor.getEmail());
                            commentAuthorSummary.setProfileImage(commentAuthor.getProfileImage());
                            commentResponse.setUser(commentAuthorSummary);
                        }
                        return commentResponse;
                    })
                    .collect(Collectors.toList());
            r.setComments(commentResponses);

            result.add(r);
        }
        return result;
    }

    private List<String> parseRecipients(String recipientsJson) {
        if (recipientsJson == null || recipientsJson.isBlank()) {
            return new ArrayList<>();
        }
        String trimmed = recipientsJson.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        if (trimmed.isBlank()) {
            return new ArrayList<>();
        }
        String[] parts = trimmed.split(",");
        List<String> recipients = new ArrayList<>();
        for (String part : parts) {
            String value = part.trim();
            if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length() - 1);
            }
            if (!value.isBlank()) {
                recipients.add(value);
            }
        }
        return recipients;
    }
}
