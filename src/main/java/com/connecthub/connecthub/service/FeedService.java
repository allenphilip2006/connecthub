package com.connecthub.connecthub.service;

import com.connecthub.connecthub.dto.PostResponse;
import com.connecthub.connecthub.model.Post;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.repository.FollowerRepository;
import com.connecthub.connecthub.repository.PostRepository;
import com.connecthub.connecthub.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FeedService {

    private final UserRepository userRepository;
    private final FollowerRepository followerRepository;
    private final PostRepository postRepository;
    private final PostService postService;

    public FeedService(UserRepository userRepository,
            FollowerRepository followerRepository,
            PostRepository postRepository,
            PostService postService) {
        this.userRepository = userRepository;
        this.followerRepository = followerRepository;
        this.postRepository = postRepository;
        this.postService = postService;
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(String email, Pageable pageable) {

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<Long> followingIds = followerRepository.findFollowingIdsByFollowerId(currentUser.getId());
        List<String> followingEmails = Collections.emptyList();

        if (!followingIds.isEmpty()) {
            Map<Long, User> userMap = userRepository.mapById(followingIds);
            followingEmails = userMap.values().stream()
                    .map(User::getEmail)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }

        List<Post> finalFeed = new ArrayList<>(pageable.getPageSize());
        Set<Long> seenPostIds = new HashSet<>();

        if (!followingEmails.isEmpty()) {
            Page<Post> followedPosts = postRepository.findByAuthorEmailInAndDeletedFalseAndArchivedFalse(
                    followingEmails, pageable);
            for (Post p : followedPosts.getContent()) {
                finalFeed.add(p);
                seenPostIds.add(p.getId());
            }
        }

        if (finalFeed.size() < pageable.getPageSize()) {
            Page<Post> popularPosts = postRepository
                    .findByDeletedFalseAndArchivedFalseOrderByLikeCountDescCreatedAtDesc(pageable);

            for (Post post : popularPosts.getContent()) {
                if (!seenPostIds.contains(post.getId())) {
                    finalFeed.add(post);
                    seenPostIds.add(post.getId());
                    if (finalFeed.size() >= pageable.getPageSize()) {
                        break;
                    }
                }
            }
        }

        List<PostResponse> mapped = postService.mapToResponseBatch(finalFeed, email);
        return new PageImpl<>(mapped, pageable, Math.max(finalFeed.size(), pageable.getPageSize()));
    }
}
