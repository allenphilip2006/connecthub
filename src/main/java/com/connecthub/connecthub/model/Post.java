package com.connecthub.connecthub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_post_author_email", columnList = "authorEmail"),
    @Index(name = "idx_post_deleted_archived", columnList = "deleted, archived"),
    @Index(name = "idx_post_author_deleted_archived", columnList = "authorEmail, deleted, archived"),
    @Index(name = "idx_post_like_count_created", columnList = "likeCount, createdAt DESC"),
    @Index(name = "idx_post_created_desc", columnList = "createdAt DESC")
})
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String content;

    @Column(columnDefinition = "TEXT")
    private String mediaUrl;

    @Column(columnDefinition = "TEXT")
    private String mediaMeta; // JSON list of metadata per file

    @Column(name = "location")
    private String location;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "audience")
    private String audience = "Everyone";

    @Column(name = "collab_with")
    private String collabWith;

    @Column(nullable = false)
    private String authorEmail;

    @Column(nullable = false)
    private String postType;

    @Column(nullable = false)
    private boolean deleted = false;

    @Column(nullable = false)
    private boolean archived = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // gona add
    @Column(name = "like_count")
    private Integer likeCount = 0;

    @Column(name = "original_post_id")
    private Long originalPostId;

    @Column(name = "reposted_from_email")
    private String repostedFromEmail;

    // UI preferences
    @Column(name = "show_counts", nullable = false)
    private boolean showCounts = true;

    @Column(name = "allow_comments", nullable = false)
    private boolean allowComments = true;

    public Integer getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(Integer likeCount) {
        this.likeCount = likeCount;
    }

    public Long getOriginalPostId() {
        return originalPostId;
    }

    public void setOriginalPostId(Long originalPostId) {
        this.originalPostId = originalPostId;
    }

    public String getRepostedFromEmail() {
        return repostedFromEmail;
    }

    public void setRepostedFromEmail(String repostedFromEmail) {
        this.repostedFromEmail = repostedFromEmail;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getAuthorEmail() {
        return authorEmail;
    }

    public void setAuthorEmail(String authorEmail) {
        this.authorEmail = authorEmail;
    }

    public String getPostType() {
        return postType;
    }

    public void setPostType(String postType) {
        this.postType = postType;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isShowCounts() {
        return showCounts;
    }

    public void setShowCounts(boolean showCounts) {
        this.showCounts = showCounts;
    }

    public boolean isAllowComments() {
        return allowComments;
    }

    public void setAllowComments(boolean allowComments) {
        this.allowComments = allowComments;
    }

    public String getMediaMeta() {
        return mediaMeta;
    }

    public void setMediaMeta(String mediaMeta) {
        this.mediaMeta = mediaMeta;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAltText() {
        return altText;
    }

    public void setAltText(String altText) {
        this.altText = altText;
    }

    public String getAudience() {
        return audience;
    }

    public void setAudience(String audience) {
        this.audience = audience;
    }

    public String getCollabWith() {
        return collabWith;
    }

    public void setCollabWith(String collabWith) {
        this.collabWith = collabWith;
    }
}
