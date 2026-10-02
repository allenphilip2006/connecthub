package com.connecthub.connecthub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orbit_rooms", indexes = {
    @Index(name = "idx_orbit_room_expires", columnList = "expires_at, created_at DESC"),
    @Index(name = "idx_orbit_room_host", columnList = "hostEmail, created_at DESC")
})
public class OrbitRoom {
    @Id
    private String id; // Use the UUID from frontend or generate one

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String hostEmail;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "max_participants")
    private Integer maxParticipants = 20;

    @Column(name = "spotlight_id")
    private String spotlightId;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getHostEmail() { return hostEmail; }
    public void setHostEmail(String hostEmail) { this.hostEmail = hostEmail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public String getSpotlightId() { return spotlightId; }
    public void setSpotlightId(String spotlightId) { this.spotlightId = spotlightId; }
}
