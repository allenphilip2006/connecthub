package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.OrbitMessage;
import com.connecthub.connecthub.repository.OrbitMessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/orbit/messages")
public class OrbitMessageController {

    private final OrbitMessageRepository repo;

    public OrbitMessageController(OrbitMessageRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, String> payload) {
        String roomId = payload.get("roomId") != null ? payload.get("roomId").trim() : "";
        String senderEmail = payload.get("senderEmail") != null ? payload.get("senderEmail").trim() : "";
        String text = payload.getOrDefault("text", "");
        String mediaUrl = payload.get("mediaUrl");

        boolean hasText = text != null && !text.trim().isBlank();
        boolean hasMedia = mediaUrl != null && !mediaUrl.isBlank();

        if (roomId.isBlank() || senderEmail.isBlank() || (!hasText && !hasMedia)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "roomId, senderEmail and (text or mediaUrl) are required"));
        }

        OrbitMessage m = new OrbitMessage();
        m.setRoomId(roomId);
        m.setSenderEmail(senderEmail);
        m.setText(hasText ? text.trim() : "");
        m.setMediaUrl(hasMedia ? mediaUrl : null);
        m.setCreatedAt(LocalDateTime.now());
        OrbitMessage saved = repo.save(m);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> list(@RequestParam String roomId,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "50") int size) {
        if (roomId == null || roomId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "roomId is required"));
        }
        if (size > 200) size = 200;

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<OrbitMessage> result = repo.findByRoomIdOrderByCreatedAtDesc(roomId, pageRequest);
        return ResponseEntity.ok(result);
    }
}
