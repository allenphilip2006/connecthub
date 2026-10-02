package com.connecthub.connecthub.service;

import com.connecthub.connecthub.model.Post;
import com.connecthub.connecthub.model.PostLike;
import com.connecthub.connecthub.repository.PostLikeRepository;
import com.connecthub.connecthub.repository.PostRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LikeService {

    private final PostLikeRepository likeRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;

    public LikeService(PostLikeRepository likeRepository,
                       PostRepository postRepository,
                       NotificationService notificationService) {
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.notificationService = notificationService;
    }

    public String toggleLike(String userEmail, Long postId) {

        Optional<PostLike> existing =
                likeRepository.findByUserEmailAndPostId(userEmail, postId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            postRepository.save(post);
            return "Post unliked";
        } else {
            PostLike like = new PostLike();
            like.setUserEmail(userEmail);
            like.setPostId(postId);
            likeRepository.save(like);
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);

            // 🔔 LIKE notification
            notificationService.createNotification(
                    post.getAuthorEmail(),
                    userEmail,
                    "LIKE",
                    postId
            );

            return "Post liked";
        }
    }

    public long getLikeCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean isPostLikedByUser(String userEmail, Long postId) {
        return likeRepository.findByUserEmailAndPostId(userEmail, postId).isPresent();
    }
}
