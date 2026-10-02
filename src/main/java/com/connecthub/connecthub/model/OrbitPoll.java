package com.connecthub.connecthub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orbit_polls", indexes = {
    @Index(name = "idx_orbit_poll_room", columnList = "roomId, created_at DESC")
})
public class OrbitPoll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String roomId;

    @Column(nullable = false)
    private String question;

    @Column(name = "options_json", columnDefinition = "TEXT")
    private String optionsJson; // JSON array of options

    @Column(name = "votes_json", columnDefinition = "TEXT")
    private String votesJson; // JSON object { option: count }

    @Column(name = "user_votes_json", columnDefinition = "TEXT")
    private String userVotesJson; // JSON object { email: option }

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getOptionsJson() { return optionsJson; }
    public void setOptionsJson(String optionsJson) { this.optionsJson = optionsJson; }
    public String getVotesJson() { return votesJson; }
    public void setVotesJson(String votesJson) { this.votesJson = votesJson; }
    public String getUserVotesJson() { return userVotesJson; }
    public void setUserVotesJson(String userVotesJson) { this.userVotesJson = userVotesJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
