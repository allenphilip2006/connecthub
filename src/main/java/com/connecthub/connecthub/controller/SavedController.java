package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.PostResponse;
import com.connecthub.connecthub.model.Post;
import com.connecthub.connecthub.model.SavedPost;
import com.connecthub.connecthub.repository.PostRepository;
import com.connecthub.connecthub.repository.SavedPostRepository;
import com.connecthub.connecthub.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
public class SavedController {

    private final SavedPostRepository savedRepository;
    private final PostRepository postRepository;
    private final PostService postService;

    public SavedController(SavedPostRepository savedRepository, PostRepository postRepository, PostService postService) {
        this.savedRepository = savedRepository;
        this.postRepository = postRepository;
        this.postService = postService;
    }

    @PostMapping("/{postId}/save")
    public ResponseEntity<Map<String, String>> save(@PathVariable Long postId) {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();

        if (savedRepository.findByUserEmailAndPostId(email, postId).isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Already saved"));
        }
        SavedPost sp = new SavedPost();
        sp.setUserEmail(email);
        sp.setPostId(postId);
        savedRepository.save(sp);
        return ResponseEntity.ok(Map.of("message", "Saved"));
    }

    @DeleteMapping("/{postId}/save")
    public ResponseEntity<Map<String, String>> unsave(@PathVariable Long postId) {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();

        savedRepository.findByUserEmailAndPostId(email, postId)
                .ifPresent(savedRepository::delete);
        return ResponseEntity.ok(Map.of("message", "Unsaved"));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<PostResponse>> mySaved() {
        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();

        List<Long> ids = savedRepository.findByUserEmailOrderBySavedAtDesc(email)
                .stream().map(SavedPost::getPostId).collect(Collectors.toList());
        List<Post> posts = postRepository.findAllById(ids);
        List<PostResponse> mapped = posts.stream()
                .map(post -> postService.mapToResponse(post, email))
                .collect(Collectors.toList());
        return ResponseEntity.ok(mapped);
    }
}
