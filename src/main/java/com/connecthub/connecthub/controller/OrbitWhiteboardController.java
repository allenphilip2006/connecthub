package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.OrbitWhiteboard;
import com.connecthub.connecthub.repository.OrbitWhiteboardRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/orbit/whiteboard")
public class OrbitWhiteboardController {

    private static final String EMPTY_STROKES = "[]";
    private final OrbitWhiteboardRepository repo;

    public OrbitWhiteboardController(OrbitWhiteboardRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> get(@RequestParam String roomId) {
        if (roomId == null || roomId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "roomId is required"));
        }
        OrbitWhiteboard wb = repo.findByRoomId(roomId).orElse(null);
        String strokes = (wb == null || wb.getStrokesJson() == null || wb.getStrokesJson().isBlank())
                ? EMPTY_STROKES
                : wb.getStrokesJson();
        return ResponseEntity.ok(Map.of(
                "roomId", roomId,
                "strokes", strokes,
                "updatedAt", wb != null && wb.getUpdatedAt() != null ? wb.getUpdatedAt().toString() : ""
        ));
    }

    @PutMapping
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ResponseEntity<?> save(@RequestParam String roomId, @RequestBody Map<String, Object> payload) {
        if (roomId == null || roomId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "roomId is required"));
        }

        Object strokesObj = payload.get("strokes");
        String strokes;
        if (strokesObj == null || String.valueOf(strokesObj).isBlank()) {
            strokes = EMPTY_STROKES;
        } else {
            strokes = String.valueOf(strokesObj);
            if (!strokes.startsWith("[")) {
                strokes = EMPTY_STROKES;
            }
        }

        OrbitWhiteboard wb = repo.findByRoomId(roomId).orElse(null);
        if (wb == null) {
            wb = new OrbitWhiteboard();
            wb.setRoomId(roomId);
        }
        wb.setStrokesJson(strokes);
        wb.setUpdatedAt(LocalDateTime.now());
        repo.save(wb);
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "updatedAt", wb.getUpdatedAt().toString()
        ));
    }
}
