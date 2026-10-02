package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.PostResponse;
import com.connecthub.connecthub.service.FeedService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feed")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

        if (email == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(
                feedService.getFeed(
                        email,
                        PageRequest.of(page, size)));
    }
}
