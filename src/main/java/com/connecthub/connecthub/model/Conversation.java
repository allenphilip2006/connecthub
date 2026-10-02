package com.connecthub.connecthub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations", indexes = {
    @Index(name = "idx_conv_user1", columnList = "user1Email"),
    @Index(name = "idx_conv_user2", columnList = "user2Email")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user1Email", "user2Email"})
})
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String user1Email;

    @Column(nullable = false)
    private String user2Email;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters & Setters
    public Long getId() { return id; }

    public String getUser1Email() { return user1Email; }
    public void setUser1Email(String user1Email) { this.user1Email = user1Email; }

    public String getUser2Email() { return user2Email; }
    public void setUser2Email(String user2Email) { this.user2Email = user2Email; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; } // ✅ Add setter
}
