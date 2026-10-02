package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.service.LikeService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping("/{postId}/like")
    @Transactional
    public ResponseEntity<?> likePost(@PathVariable Long postId) {

        String userEmail = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (userEmail == null) {
            return ResponseEntity.status(401).build();
        }

        String message = likeService.toggleLike(userEmail, postId);
        long count = likeService.getLikeCount(postId);
        
        boolean isLiked = likeService.isPostLikedByUser(userEmail, postId);

        return ResponseEntity.ok(Map.of(
                "message", message,
                "liked", isLiked,
                "likesCount", count));
    }

    @GetMapping("/{postId}/likes")
    public ResponseEntity<?> getLikes(@PathVariable Long postId) {
        return ResponseEntity.ok(Map.of("likes", likeService.getLikeCount(postId)));
    }
}
