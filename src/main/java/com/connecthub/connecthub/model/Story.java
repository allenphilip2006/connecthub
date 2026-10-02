package com.connecthub.connecthub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stories", indexes = {
    @Index(name = "idx_story_author_expires", columnList = "authorEmail, expires_at DESC"),
    @Index(name = "idx_story_expires", columnList = "expires_at, deleted")
})
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String authorEmail;

    @Column(length = 255)
    private String mediaUrl;

    @Column(length = 500)
    private String caption;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String captionPosition;

    // PUBLIC, FOLLOWERS, CLOSE_FRIENDS
    @Column(nullable = false)
    private String audience = "FOLLOWERS";

    @Column
    private Double mediaScale = 1.0;

    @Column(length = 1000)
    private String recipients;

    @Column(length = 255)
    private String music;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String slidesJson; // JSON array of slides for multi-slide stories

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

    @Column(nullable = false)
    private boolean deleted = false;

    public Long getId() { return id; }
    public String getAuthorEmail() { return authorEmail; }
    public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public String getCaptionPosition() { return captionPosition; }
    public void setCaptionPosition(String captionPosition) { this.captionPosition = captionPosition; }

    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }

    public Double getMediaScale() { return mediaScale; }
    public void setMediaScale(Double mediaScale) { this.mediaScale = mediaScale; }

    public String getRecipients() { return recipients; }
    public void setRecipients(String recipients) { this.recipients = recipients; }

    public String getMusic() { return music; }
    public void setMusic(String music) { this.music = music; }

    public String getSlidesJson() { return slidesJson; }
    public void setSlidesJson(String slidesJson) { this.slidesJson = slidesJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
