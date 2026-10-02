package com.connecthub.connecthub.dto;

import java.time.LocalDateTime;
import java.util.List;

public class StoryResponse {
    private Long id;
    private String mediaUrl;
    private String caption;
    private String captionPosition;
    private String audience;
    private Double mediaScale;
    private String recipients;
    private String music;
    private String slides; // JSON array of slides
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private int viewCount;
    private List<UserSummary> viewers;
    private List<StoryViewResponse> viewDetails;
    private int likeCount;
    private boolean likedByMe;
    private List<StoryCommentResponse> comments;
    private UserSummary user;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public String getSlides() { return slides; }
    public void setSlides(String slides) { this.slides = slides; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public int getViewCount() { return viewCount; }
    public void setViewCount(int viewCount) { this.viewCount = viewCount; }

    public List<UserSummary> getViewers() { return viewers; }
    public void setViewers(List<UserSummary> viewers) { this.viewers = viewers; }

    public List<StoryViewResponse> getViewDetails() { return viewDetails; }
    public void setViewDetails(List<StoryViewResponse> viewDetails) { this.viewDetails = viewDetails; }

    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }

    public boolean isLikedByMe() { return likedByMe; }
    public void setLikedByMe(boolean likedByMe) { this.likedByMe = likedByMe; }

    public List<StoryCommentResponse> getComments() { return comments; }
    public void setComments(List<StoryCommentResponse> comments) { this.comments = comments; }
    public UserSummary getUser() { return user; }
    public void setUser(UserSummary user) { this.user = user; }
}
