package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.Post;
import com.connecthub.connecthub.model.Hashtag;
import com.connecthub.connecthub.model.PostHashtag;
import com.connecthub.connecthub.repository.HashtagRepository;
import com.connecthub.connecthub.repository.PostHashtagRepository;
import com.connecthub.connecthub.repository.PostRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final HashtagRepository hashtagRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final PostRepository postRepository;

    public SearchController(HashtagRepository hashtagRepository,
                            PostHashtagRepository postHashtagRepository,
                            PostRepository postRepository) {
        this.hashtagRepository = hashtagRepository;
        this.postHashtagRepository = postHashtagRepository;
        this.postRepository = postRepository;
    }

    @GetMapping("/hashtags")
    public ResponseEntity<List<String>> hashtags(@RequestParam String q) {
        List<String> names = hashtagRepository.findByNameContainingIgnoreCase(q)
                .stream().map(Hashtag::getName).collect(Collectors.toList());
        return ResponseEntity.ok(names);
    }

    @GetMapping("/hashtags/{name}")
    public ResponseEntity<List<Post>> postsByHashtag(@PathVariable String name) {
        Hashtag tag = hashtagRepository.findByName(name.toLowerCase()).orElse(null);
        if (tag == null) return ResponseEntity.ok(List.of());
        List<PostHashtag> links = postHashtagRepository.findByHashtagId(tag.getId());
        List<Long> postIds = links.stream().map(PostHashtag::getPostId).collect(Collectors.toList());
        return ResponseEntity.ok(postRepository.findAllById(postIds));
    }
}
