package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.OrbitParticipant;
import com.connecthub.connecthub.model.OrbitRoom;
import com.connecthub.connecthub.repository.OrbitParticipantRepository;
import com.connecthub.connecthub.repository.OrbitRoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orbit/rooms")
public class OrbitRoomController {

    private final OrbitRoomRepository roomRepo;
    private final OrbitParticipantRepository participantRepo;

    public OrbitRoomController(OrbitRoomRepository roomRepo, OrbitParticipantRepository participantRepo) {
        this.roomRepo = roomRepo;
        this.participantRepo = participantRepo;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, Object> payload) {
        String id = (String) payload.getOrDefault("id", java.util.UUID.randomUUID().toString());
        String name = (String) payload.getOrDefault("name", "Untitled Room");
        String hostEmail = (String) payload.getOrDefault("hostEmail", "");

        if (hostEmail == null || hostEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "hostEmail is required"));
        }

        int duration;
        try {
            Number dur = (Number) payload.getOrDefault("duration", 3600);
            duration = dur.intValue();
            if (duration < 60) duration = 60;
            if (duration > 86400) duration = 86400;
        } catch (Exception e) {
            duration = 3600;
        }

        int maxParticipants;
        try {
            Number mp = (Number) payload.getOrDefault("maxParticipants", 20);
            maxParticipants = mp.intValue();
            if (maxParticipants < 2) maxParticipants = 2;
            if (maxParticipants > 100) maxParticipants = 100;
        } catch (Exception e) {
            maxParticipants = 20;
        }

        if (roomRepo.existsById(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Room with this ID already exists"));
        }

        OrbitRoom room = new OrbitRoom();
        room.setId(id);
        room.setName(name == null || name.isBlank() ? "Untitled Room" : name);
        room.setHostEmail(hostEmail);
        room.setCreatedAt(LocalDateTime.now());
        room.setExpiresAt(LocalDateTime.now().plusSeconds(duration));
        room.setMaxParticipants(maxParticipants);
        room.setSpotlightId(hostEmail);

        OrbitRoom saved = roomRepo.save(room);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> get(@PathVariable String id) {
        Optional<OrbitRoom> roomOpt = roomRepo.findById(id);
        if (roomOpt.isEmpty()) return ResponseEntity.notFound().build();
        OrbitRoom room = roomOpt.get();
        List<OrbitParticipant> participants = participantRepo.findByRoomId(id);
        boolean isExpired = room.getExpiresAt() != null && room.getExpiresAt().isBefore(LocalDateTime.now());
        return ResponseEntity.ok(Map.of(
                "room", room,
                "participants", participants,
                "participantCount", participants.size(),
                "expired", isExpired
        ));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<OrbitRoom>> listActive() {
        return ResponseEntity.ok(roomRepo.findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime.now()));
    }

    @PostMapping("/{id}/join")
    @Transactional
    public ResponseEntity<?> join(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String username = payload.get("username");
        String avatar = payload.getOrDefault("avatar", null);

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email is required"));
        }
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "username is required"));
        }

        Optional<OrbitRoom> roomOpt = roomRepo.findById(id);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        OrbitRoom room = roomOpt.get();

        if (room.getExpiresAt() != null && room.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(Map.of("error", "This room has expired"));
        }

        Optional<OrbitParticipant> existing = participantRepo.findByRoomIdAndUserEmail(id, email);
        if (existing.isPresent()) {
            OrbitParticipant p = existing.get();
            if ((username != null && !username.equals(p.getUsername()))
                    || (avatar != null && !avatar.equals(p.getAvatar()))) {
                p.setUsername(username);
                p.setAvatar(avatar);
                p = participantRepo.save(p);
            }
            return ResponseEntity.ok(p);
        }

        long participantCount = participantRepo.countByRoomId(id);
        if (room.getMaxParticipants() != null && participantCount >= room.getMaxParticipants()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Room is full (max " + room.getMaxParticipants() + " participants)"));
        }

        OrbitParticipant p = new OrbitParticipant();
        p.setRoomId(id);
        p.setUserEmail(email);
        p.setUsername(username);
        p.setAvatar(avatar);
        p.setJoinedAt(LocalDateTime.now());
        return ResponseEntity.ok(participantRepo.save(p));
    }

    @DeleteMapping("/{id}/leave")
    @Transactional
    public ResponseEntity<Void> leave(@PathVariable String id, @RequestParam String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        participantRepo.deleteByRoomIdAndUserEmail(id, email);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/spotlight")
    @Transactional
    public ResponseEntity<?> spotlight(@PathVariable String id,
                                         @RequestParam String userId,
                                         @RequestParam(required = false) String hostEmail) {
        Optional<OrbitRoom> roomOpt = roomRepo.findById(id);
        if (roomOpt.isEmpty()) return ResponseEntity.notFound().build();
        OrbitRoom room = roomOpt.get();

        if (hostEmail != null && !hostEmail.equals(room.getHostEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the host can set the spotlight"));
        }
        room.setSpotlightId(userId);
        return ResponseEntity.ok(roomRepo.save(room));
    }
}
