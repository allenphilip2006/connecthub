package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.StoryResponse;
import com.connecthub.connecthub.service.StoryService;
import com.connecthub.connecthub.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
public class StoryController {

    private final StoryService storyService;

    public StoryController(StoryService storyService) {
        this.storyService = storyService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StoryResponse> create(
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) String captionPosition,
            @RequestParam(defaultValue = "FOLLOWERS") String audience,
            @RequestParam(required = false) Double mediaScale,
            @RequestParam(required = false) String recipients,
            @RequestParam(required = false) String music,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false, name = "files") List<MultipartFile> files,
            @RequestParam(required = false, name = "slides") String slidesMeta) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        MultipartFile[] arr = files != null && !files.isEmpty() ? files.toArray(new MultipartFile[0]) : null;
        return ResponseEntity.ok(storyService.create(email, caption, captionPosition, audience, mediaScale, recipients, music, file, arr, slidesMeta));
    }

    @GetMapping("/me")
    public ResponseEntity<List<StoryResponse>> myStories() {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.myStories(email));
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<StoryResponse>> feed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.feed(email, page, size));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoryResponse> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        Double mediaScale = null;
        if (body.get("mediaScale") != null) {
            try {
                mediaScale = Double.parseDouble(body.get("mediaScale"));
            } catch (NumberFormatException ignored) {
                mediaScale = null;
            }
        }
        return ResponseEntity.ok(storyService.update(
                id,
                email,
                body.get("caption"),
                body.get("captionPosition"),
                body.get("audience"),
                mediaScale,
                body.get("recipients"),
                body.get("music"),
                body.get("slides")
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoryResponse> getById(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.getById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        storyService.delete(id, email);
        return ResponseEntity.ok("Story deleted");
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<?> recordStoryView(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        storyService.recordView(id, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/slide-view")
    public ResponseEntity<Void> recordSlideView(@PathVariable Long id, @RequestParam String slideId) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        storyService.recordSlideView(id, slideId, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeStory(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        storyService.likeStory(id, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/unlike")
    public ResponseEntity<?> unlikeStory(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        storyService.unlikeStory(id, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) return ResponseEntity.badRequest().body("Comment content cannot be empty");
        storyService.addComment(id, email, content);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comment/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        String email = SecurityUtils.getCurrentUserEmail().orElse(null);
        if (email == null) return ResponseEntity.status(401).build();
        storyService.deleteComment(commentId, email);
        return ResponseEntity.ok().build();
    }
}
