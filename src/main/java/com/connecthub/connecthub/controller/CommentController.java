package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.CommentResponse;
import com.connecthub.connecthub.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/{postId}/comment")
    public ResponseEntity<?> addComment(
            @PathVariable Long postId,
            @RequestBody Map<String, String> body) {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null)
            return ResponseEntity.status(401).build();

        CommentResponse response = commentService.addComment(postId, body.get("text"), email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long postId) {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        List<CommentResponse> comments = commentService.getComments(postId, email);
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null)
            return ResponseEntity.status(401).build();

        commentService.deleteComment(commentId, email);
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }

    @PostMapping("/{postId}/comments/{parentCommentId}/reply")
    public ResponseEntity<?> addReply(
            @PathVariable Long postId,
            @PathVariable Long parentCommentId,
            @RequestBody Map<String, String> body) {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null)
            return ResponseEntity.status(401).build();

        CommentResponse response = commentService.addReply(postId, parentCommentId, body.get("text"), email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> likeComment(@PathVariable Long commentId) {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null)
            return ResponseEntity.status(401).build();

        commentService.likeComment(commentId, email);
        return ResponseEntity.ok(Map.of("message", "Liked"));
    }

    @PostMapping("/comments/{commentId}/unlike")
    public ResponseEntity<?> unlikeComment(@PathVariable Long commentId) {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null)
            return ResponseEntity.status(401).build();

        commentService.unlikeComment(commentId, email);
        return ResponseEntity.ok(Map.of("message", "Unliked"));
    }
}
