package com.connecthub.connecthub.dto;

import java.time.LocalDateTime;

public class PostResponse {
    private Long id;
    private String content;
    private String mediaUrl;
    private String authorEmail;
    private String postType;
    private boolean archived;
    private LocalDateTime createdAt;
    private long likesCount;
    private long commentsCount;
    private boolean isLiked;
    private Long originalPostId;
    private String repostedFromEmail;
    private UserSummary user;
    private boolean showCounts;
    private boolean allowComments;
    private String mediaMeta;
    private String location;
    private String altText;
    private String audience;
    private String collabWith;

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

    public long getLikesCount() {
        return likesCount;
    }

    public void setLikesCount(long likesCount) {
        this.likesCount = likesCount;
    }

    public long getCommentsCount() {
        return commentsCount;
    }

    public void setCommentsCount(long commentsCount) {
        this.commentsCount = commentsCount;
    }

    public boolean isLiked() {
        return isLiked;
    }

    public void setLiked(boolean liked) {
        isLiked = liked;
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

    public UserSummary getUser() {
        return user;
    }

    public void setUser(UserSummary user) {
        this.user = user;
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
