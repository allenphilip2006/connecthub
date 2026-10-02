package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.OrbitPoll;
import com.connecthub.connecthub.repository.OrbitPollRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/orbit/polls")
public class OrbitPollController {

    private final OrbitPollRepository repo;
    private final ObjectMapper mapper;

    public OrbitPollController(OrbitPollRepository repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, Object> payload) {
        String roomId = payload.get("roomId") != null ? String.valueOf(payload.get("roomId")).trim() : "";
        String question = payload.get("question") != null ? String.valueOf(payload.get("question")).trim() : "";
        Object optionsObj = payload.get("options");
        List<String> options = Collections.emptyList();
        if (optionsObj instanceof List<?>) {
            options = ((List<?>) optionsObj).stream()
                    .filter(Objects::nonNull)
                    .map(o -> String.valueOf(o).trim())
                    .filter(s -> !s.isBlank())
                    .limit(10)
                    .toList();
        }

        if (roomId.isBlank() || question.isBlank() || options.size() < 2) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "roomId, question (min 2 options) are required"));
        }

        Map<String, Integer> votes = new LinkedHashMap<>();
        for (String opt : options) votes.put(opt, 0);
        Map<String, String> userVotes = new HashMap<>();
        try {
            OrbitPoll p = new OrbitPoll();
            p.setRoomId(roomId);
            p.setQuestion(question);
            p.setOptionsJson(mapper.writeValueAsString(options));
            p.setVotesJson(mapper.writeValueAsString(votes));
            p.setUserVotesJson(mapper.writeValueAsString(userVotes));
            p.setCreatedAt(LocalDateTime.now());
            OrbitPoll saved = repo.save(p);
            return ResponseEntity.ok(Map.of(
                    "id", saved.getId(),
                    "roomId", saved.getRoomId(),
                    "question", saved.getQuestion(),
                    "options", options,
                    "votes", votes
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create poll: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/vote")
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ResponseEntity<?> vote(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String email = payload.get("email") != null ? String.valueOf(payload.get("email")).trim() : "";
        String option = payload.get("option") != null ? String.valueOf(payload.get("option")).trim() : "";

        if (option.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Option is required"));
        }

        OrbitPoll poll = repo.findById(id).orElse(null);
        if (poll == null) return ResponseEntity.notFound().build();
        try {
            List<String> options = mapper.readValue(poll.getOptionsJson(), new TypeReference<List<String>>() {});
            Map<String, Integer> votes = mapper.readValue(poll.getVotesJson(), new TypeReference<Map<String, Integer>>() {});
            Map<String, String> userVotes = mapper.readValue(poll.getUserVotesJson(), new TypeReference<Map<String, String>>() {});

            if (!options.contains(option)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid option"));
            }
            if (email != null && !email.isBlank()) {
                if (userVotes.containsKey(email)) {
                    String currentVote = userVotes.get(email);
                    if (currentVote.equals(option)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Already voted for this option"));
                    }
                    votes.put(currentVote, Math.max(0, votes.getOrDefault(currentVote, 1) - 1));
                    votes.put(option, votes.getOrDefault(option, 0) + 1);
                    userVotes.put(email, option);
                } else {
                    userVotes.put(email, option);
                    votes.put(option, votes.getOrDefault(option, 0) + 1);
                }
            } else {
                votes.put(option, votes.getOrDefault(option, 0) + 1);
            }

            poll.setVotesJson(mapper.writeValueAsString(votes));
            poll.setUserVotesJson(mapper.writeValueAsString(userVotes));
            repo.save(poll);
            return ResponseEntity.ok(Map.of(
                    "id", poll.getId(),
                    "roomId", poll.getRoomId(),
                    "question", poll.getQuestion(),
                    "options", options,
                    "votes", votes,
                    "totalVotes", votes.values().stream().mapToInt(Integer::intValue).sum()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to record vote: " + e.getMessage()));
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> list(@RequestParam String roomId,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        if (roomId == null || roomId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "roomId is required"));
        }
        if (size > 100) size = 100;

        Page<OrbitPoll> pol = repo.findByRoomIdOrderByCreatedAtDesc(roomId, PageRequest.of(page, size));
        List<Map<String, Object>> out = new ArrayList<>(pol.getNumberOfElements());
        try {
            for (OrbitPoll p : pol.getContent()) {
                List<String> options = mapper.readValue(p.getOptionsJson(), new TypeReference<List<String>>() {});
                Map<String, Integer> votes = mapper.readValue(p.getVotesJson(), new TypeReference<Map<String, Integer>>() {});
                int totalVotes = votes.values().stream().mapToInt(Integer::intValue).sum();
                out.add(Map.of(
                        "id", p.getId(),
                        "roomId", p.getRoomId(),
                        "question", p.getQuestion(),
                        "options", options,
                        "votes", votes,
                        "totalVotes", totalVotes,
                        "createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : ""
                ));
            }
            return ResponseEntity.ok(Map.of(
                    "content", out,
                    "totalElements", pol.getTotalElements(),
                    "totalPages", pol.getTotalPages(),
                    "page", page,
                    "size", size
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to list polls: " + e.getMessage()));
        }
    }
}
