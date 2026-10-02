package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.PostResponse;
import com.connecthub.connecthub.model.Post;
import com.connecthub.connecthub.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
public class PostController {

        private final PostService postService;

        public PostController(PostService postService) {
                this.postService = postService;
        }

        // ---------------- CREATE POST ----------------
        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<Post> createPost(
                        @RequestParam(required = false) String content,
                        @RequestParam(defaultValue = "IMAGE") String postType,
                        @RequestParam(required = false) List<MultipartFile> files,
                        @RequestParam(defaultValue = "true") boolean showCounts,
                        @RequestParam(defaultValue = "true") boolean allowComments,
                        @RequestParam(required = false) String location,
                        @RequestParam(required = false) String altText,
                        @RequestParam(required = false) String audience,
                        @RequestParam(required = false) String collabWith,
                        @RequestParam Map<String, String> allParams) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();

                // Extract mediaMeta_i params
                List<String> mediaMeta = allParams.entrySet().stream()
                        .filter(e -> e.getKey().startsWith("mediaMeta_"))
                        .sorted(Map.Entry.comparingByKey())
                        .map(Map.Entry::getValue)
                        .collect(Collectors.toList());

                String normalized = postType == null ? "IMAGE" : postType.toUpperCase();
                
                return ResponseEntity.ok(
                                postService.createPost(
                                                content,
                                                normalized,
                                                files,
                                                email,
                                                showCounts,
                                                allowComments,
                                                location,
                                                altText,
                                                audience,
                                                collabWith,
                                                mediaMeta.isEmpty() ? null : "[" + String.join(",", mediaMeta) + "]"));
        }

        // ---------------- MY POSTS ----------------
        @GetMapping("/me")
        public ResponseEntity<Page<PostResponse>> getMyPosts(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();
                return ResponseEntity.ok(
                                postService.getMyPosts(
                                                email,
                                                page,
                                                size));
        }

        @GetMapping("/user/{userId}")
        public ResponseEntity<Page<PostResponse>> getUserPosts(
                        @PathVariable Long userId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();
                return ResponseEntity.ok(
                                postService.getUserPosts(
                                                userId,
                                                email,
                                                page,
                                                size));
        }

        @GetMapping("/{id}")
        public ResponseEntity<PostResponse> getPostById(@PathVariable Long id) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();
                try {
                        return ResponseEntity.ok(postService.getPostById(id, email));
                } catch (RuntimeException ex) {
                        String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
                        if (message.contains("unauthorized")) {
                                return ResponseEntity.status(403).build();
                        }
                        return ResponseEntity.status(404).build();
                }
        }

        // ---------------- DELETE POST ----------------
        @DeleteMapping("/{id}")
        public ResponseEntity<?> deletePost(
                        @PathVariable Long id) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();
                postService.deletePost(id, email);
                return ResponseEntity.ok("Post deleted successfully");
        }

        // ---------------- EDIT POST ----------------
        @PutMapping("/{id}")
        public ResponseEntity<Post> updatePost(
                        @PathVariable Long id,
                        @RequestBody java.util.Map<String, String> body) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();
                return ResponseEntity.ok(postService.updatePost(id, body.get("content"), email));
        }

        // ---------------- UPDATE UI SETTINGS ----------------
        @PutMapping("/{id}/settings")
        public ResponseEntity<Post> updateSettings(
                        @PathVariable Long id,
                        @RequestBody java.util.Map<String, Boolean> body) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();
                boolean showCounts = body.getOrDefault("showCounts", true);
                boolean allowComments = body.getOrDefault("allowComments", true);
                return ResponseEntity.ok(postService.updatePostSettings(id, showCounts, allowComments, email));
        }

        // ---------------- ARCHIVE POST ----------------
        @PostMapping("/{id}/archive")
        public ResponseEntity<Post> archivePost(
                        @PathVariable Long id) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();
                return ResponseEntity.ok(postService.toggleArchive(id, email));
        }

        @PostMapping("/{id}/repost")
        public ResponseEntity<Post> repost(
                        @PathVariable Long id,
                        @RequestBody java.util.Map<String, String> body) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();
                String caption = body.getOrDefault("caption", null);
                return ResponseEntity.ok(postService.repost(id, caption, email));
        }
}
