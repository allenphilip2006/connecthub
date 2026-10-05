package com.connecthub.connecthub.service;

import com.connecthub.connecthub.dto.PostResponse;
import com.connecthub.connecthub.dto.UserSummary;
import com.connecthub.connecthub.model.Post;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.repository.CommentRepository;
import com.connecthub.connecthub.repository.FollowerRepository;
import com.connecthub.connecthub.repository.PostLikeRepository;
import com.connecthub.connecthub.repository.PostRepository;
import com.connecthub.connecthub.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.connecthub.connecthub.model.Hashtag;
import com.connecthub.connecthub.model.PostHashtag;
import com.connecthub.connecthub.repository.HashtagRepository;
import com.connecthub.connecthub.repository.PostHashtagRepository;

@Service
public class PostService {

    @org.springframework.beans.factory.annotation.Value("${connecthub.post.upload-dir:./uploads/}")
    private String UPLOAD_DIR;

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FollowerRepository followerRepository;
    private final HashtagRepository hashtagRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final NotificationService notificationService;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository,
            FollowerRepository followerRepository,
            HashtagRepository hashtagRepository,
            PostHashtagRepository postHashtagRepository,
            NotificationService notificationService,
            PostLikeRepository postLikeRepository,
            CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.followerRepository = followerRepository;
        this.hashtagRepository = hashtagRepository;
        this.postHashtagRepository = postHashtagRepository;
        this.notificationService = notificationService;
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional
    public Post createPost(String content, String postType, List<MultipartFile> files, String authorEmail, boolean showCounts, boolean allowComments, String location, String altText, String audience, String collabWith, String mediaMeta) {

        List<String> mediaUrls = new ArrayList<>();

        try {
            if (files != null && !files.isEmpty()) {
                Path uploadPath = Paths.get(UPLOAD_DIR);
                Files.createDirectories(uploadPath);

                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;

                    String originalName = file.getOriginalFilename();
                    String extension = "";
                    if (originalName != null && originalName.contains(".")) {
                        extension = originalName.substring(originalName.lastIndexOf("."));
                    }

                    String fileName = UUID.randomUUID() + extension;
                    Path filePath = uploadPath.resolve(fileName);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    mediaUrls.add("/uploads/" + fileName);
                }
            }

            Post post = new Post();
            post.setContent(content);
            post.setPostType(postType);
            post.setAuthorEmail(authorEmail);
            post.setMediaUrl(mediaUrls.isEmpty() ? null : String.join(",", mediaUrls));
            post.setMediaMeta(mediaMeta);
            post.setLocation(location);
            post.setAltText(altText);
            post.setAudience(audience);
            post.setCollabWith(collabWith);
            post.setCreatedAt(LocalDateTime.now());
            post.setShowCounts(showCounts);
            post.setAllowComments(allowComments);
            post.setLikeCount(0);

            Post saved = postRepository.save(post);
            indexHashtags(saved);
            notifyMentions(authorEmail, content, saved.getId());
            notifyTagsFromMeta(authorEmail, mediaMeta, saved.getId());
            return saved;
        } catch (Exception e) {
            throw new RuntimeException("Upload failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Post updatePostSettings(Long postId, boolean showCounts, boolean allowComments, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthorEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }
        post.setShowCounts(showCounts);
        post.setAllowComments(allowComments);
        return postRepository.save(post);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(String currentEmail, int page, int size) {
        Page<Post> pageResult = postRepository.findByDeletedFalseAndArchivedFalse(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        List<PostResponse> mapped = mapToResponseBatch(pageResult.getContent(), currentEmail);
        return new PageImpl<>(mapped, pageResult.getPageable(), pageResult.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getMyPosts(String email, int page, int size) {
        Page<Post> pageResult = postRepository.findByAuthorEmailAndDeletedFalse(
                email,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        List<PostResponse> mapped = mapToResponseBatch(pageResult.getContent(), email);
        return new PageImpl<>(mapped, pageResult.getPageable(), pageResult.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getUserPosts(Long targetUserId, String currentEmail, int page, int size) {
        User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (targetUser.isPrivate()) {
            if (currentUser == null)
                throw new RuntimeException("Unauthorized");
            if (!currentUser.getId().equals(targetUser.getId())) {
                boolean isAccepted = followerRepository
                        .findByFollowerIdAndFollowingId(currentUser.getId(), targetUser.getId())
                        .map(f -> "ACCEPTED".equals(f.getStatus()))
                        .orElse(false);
                if (!isAccepted) {
                    return Page.empty();
                }
            }
        }

        boolean isSelf = currentUser != null && currentUser.getEmail().equals(targetUser.getEmail());
        Page<Post> pageResult;
        if (isSelf) {
            pageResult = postRepository.findByAuthorEmailAndDeletedFalse(
                    targetUser.getEmail(),
                    PageRequest.of(page, size, Sort.by("createdAt").descending()));
        } else {
            pageResult = postRepository.findByAuthorEmailAndDeletedFalseAndArchivedFalse(
                    targetUser.getEmail(),
                    PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }
        List<PostResponse> mapped = mapToResponseBatch(pageResult.getContent(), currentEmail);
        return new PageImpl<>(mapped, pageResult.getPageable(), pageResult.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long postId, String currentEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.isDeleted()) {
            throw new RuntimeException("Post not found");
        }

        User currentUser = currentEmail == null ? null : userRepository.findByEmail(currentEmail).orElse(null);
        User author = userRepository.findByEmail(post.getAuthorEmail()).orElse(null);

        if (author != null && author.isPrivate()) {
            if (currentUser == null) {
                throw new RuntimeException("Unauthorized");
            }
            if (!currentUser.getId().equals(author.getId())) {
                boolean isAccepted = followerRepository
                        .findByFollowerIdAndFollowingId(currentUser.getId(), author.getId())
                        .map(f -> "ACCEPTED".equals(f.getStatus()))
                        .orElse(false);
                if (!isAccepted) {
                    throw new RuntimeException("Unauthorized");
                }
            }
        }

        if (post.isArchived() && (currentUser == null || !post.getAuthorEmail().equals(currentUser.getEmail()))) {
            throw new RuntimeException("Post not found");
        }

        return mapToResponse(post, currentEmail);
    }

    @Transactional
    public void deletePost(Long postId, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthorEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }

        post.setDeleted(true);
        postRepository.save(post);
    }

    @Transactional
    public Post updatePost(Long postId, String content, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthorEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }

        post.setContent(content);
        Post saved = postRepository.save(post);
        postHashtagRepository.deleteByPostId(post.getId());
        indexHashtags(saved);
        notifyMentions(email, content, saved.getId());
        return saved;
    }

    @Transactional
    public Post toggleArchive(Long postId, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthorEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }

        post.setArchived(!post.isArchived());
        return postRepository.save(post);
    }

    @Transactional
    public Post repost(Long originalPostId, String caption, String reposterEmail) {
        Post original = postRepository.findById(originalPostId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User reposter = userRepository.findByEmail(reposterEmail).orElse(null);
        User originalAuthor = userRepository.findByEmail(original.getAuthorEmail()).orElse(null);

        if (originalAuthor != null && originalAuthor.isPrivate()) {
            boolean allowed = false;
            if (reposter != null && reposter.getId().equals(originalAuthor.getId())) {
                allowed = true;
            } else if (reposter != null) {
                allowed = followerRepository
                        .findByFollowerIdAndFollowingId(reposter.getId(), originalAuthor.getId())
                        .map(f -> "ACCEPTED".equals(f.getStatus()))
                        .orElse(false);
            }
            if (!allowed) {
                throw new RuntimeException("Not allowed to repost");
            }
        }

        Post repost = new Post();
        repost.setContent(caption);
        repost.setPostType(original.getPostType());
        repost.setAuthorEmail(reposterEmail);
        repost.setMediaUrl(original.getMediaUrl());
        repost.setCreatedAt(LocalDateTime.now());
        repost.setOriginalPostId(original.getId());
        repost.setRepostedFromEmail(original.getAuthorEmail());
        repost.setLikeCount(0);

        return postRepository.save(repost);
    }

    public PostResponse mapToResponse(Post post, String currentEmail) {
        return mapToResponseBatch(Collections.singletonList(post), currentEmail).get(0);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> mapToResponseBatch(List<Post> posts, String currentEmail) {
        if (posts == null || posts.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        Set<String> authorEmails = posts.stream().map(Post::getAuthorEmail)
                .filter(Objects::nonNull).collect(Collectors.toSet());

        Map<Long, Long> likeCountMap = postLikeRepository.countMapByPostIds(postIds);
        Map<Long, Long> commentCountMap = commentRepository.countMapByPostIds(postIds);
        Set<Long> likedByCurrentUser = (currentEmail != null)
                ? new HashSet<>(postLikeRepository.findLikedPostIdsByUserEmailAndPostIdIn(currentEmail, postIds))
                : Collections.emptySet();
        Map<String, User> authorMap = userRepository.mapByEmail(authorEmails);

        List<PostResponse> result = new ArrayList<>(posts.size());
        for (Post post : posts) {
            PostResponse response = new PostResponse();
            response.setId(post.getId());
            response.setContent(post.getContent());
            response.setMediaUrl(post.getMediaUrl());
            response.setAuthorEmail(post.getAuthorEmail());
            response.setPostType(post.getPostType());
            response.setArchived(post.isArchived());
            response.setCreatedAt(post.getCreatedAt());
            response.setOriginalPostId(post.getOriginalPostId());
            response.setRepostedFromEmail(post.getRepostedFromEmail());
            response.setShowCounts(post.isShowCounts());
            response.setAllowComments(post.isAllowComments());
            response.setMediaMeta(post.getMediaMeta());
            response.setLocation(post.getLocation());
            response.setAltText(post.getAltText());
            response.setAudience(post.getAudience());
            response.setCollabWith(post.getCollabWith());

            long likesCount = Math.max(
                    post.getLikeCount() != null ? post.getLikeCount() : 0,
                    likeCountMap.getOrDefault(post.getId(), 0L));
            long commentsCount = commentCountMap.getOrDefault(post.getId(), 0L);
            response.setLikesCount(likesCount);
            response.setCommentsCount(commentsCount);
            response.setLiked(!likedByCurrentUser.isEmpty() && likedByCurrentUser.contains(post.getId()));

            User author = authorMap.get(post.getAuthorEmail());
            if (author != null) {
                UserSummary summary = new UserSummary();
                summary.setId(author.getId());
                summary.setUsername(author.getUsername());
                summary.setEmail(author.getEmail());
                summary.setProfileImage(author.getProfileImage());
                response.setUser(summary);
            }
            result.add(response);
        }
        return result;
    }

    private void indexHashtags(Post post) {
        String text = post.getContent() == null ? "" : post.getContent();
        Pattern p = Pattern.compile("#([A-Za-z0-9_]+)");
        Matcher m = p.matcher(text);
        List<String> tags = new ArrayList<>();
        while (m.find()) {
            tags.add(m.group(1).toLowerCase());
        }
        if (tags.isEmpty()) return;

        List<Hashtag> allTags = hashtagRepository.findByNameIn(tags);
        Map<String, Hashtag> existingByName = allTags.stream()
                .collect(Collectors.toMap(Hashtag::getName, h -> h, (a, b) -> a));
        List<PostHashtag> toSave = new ArrayList<>(tags.size());

        for (String name : tags) {
            Hashtag tag = existingByName.computeIfAbsent(name, k -> {
                Hashtag nh = new Hashtag();
                nh.setName(k);
                return hashtagRepository.save(nh);
            });
            PostHashtag ph = new PostHashtag();
            ph.setPostId(post.getId());
            ph.setHashtagId(tag.getId());
            toSave.add(ph);
        }
        postHashtagRepository.saveAll(toSave);
    }

    private void notifyMentions(String senderEmail, String text, Long postId) {
        if (text == null || text.isBlank()) return;
        Pattern p = Pattern.compile("@([A-Za-z0-9_]+)");
        Matcher m = p.matcher(text);
        Set<String> usernames = new HashSet<>();
        while (m.find()) {
            usernames.add(m.group(1).toLowerCase());
        }
        if (usernames.isEmpty()) return;

        List<User> candidates = userRepository.findByUsernameContainingIgnoreCase(
                usernames.iterator().next().length() > 2 ? usernames.iterator().next() : "");
        Map<String, User> byLower = candidates.stream()
                .collect(Collectors.toMap(u -> u.getUsername().toLowerCase(), u -> u, (a, b) -> a));
        for (String uname : usernames) {
            User u = byLower.get(uname);
            if (u != null && !u.getEmail().equals(senderEmail)) {
                notificationService.createNotification(u.getEmail(), senderEmail, "MENTION", postId);
            }
        }
    }

    private void notifyTagsFromMeta(String senderEmail, String mediaMeta, Long postId) {
        if (mediaMeta == null || mediaMeta.isBlank() || mediaMeta.equals("[]")) return;

        try {
            Pattern p = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"");
            Matcher m = p.matcher(mediaMeta);
            Set<String> uniqueEmails = new HashSet<>();
            while (m.find()) {
                uniqueEmails.add(m.group(1));
            }
            for (String recipientEmail : uniqueEmails) {
                if (!recipientEmail.equals(senderEmail)) {
                    notificationService.createNotification(recipientEmail, senderEmail, "TAG", postId);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse tags from meta: " + e.getMessage());
        }
    }
}
