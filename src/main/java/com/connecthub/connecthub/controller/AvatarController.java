package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class AvatarController {

    private final UserRepository userRepository;

    public AvatarController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/avatar")
    public ResponseEntity<Map<String, String>> avatar(@RequestParam String email) {
        User u = userRepository.findByEmail(email).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        String url = u.getProfileImage();
        return ResponseEntity.ok(Map.of("profileImage", url));
    }
}
