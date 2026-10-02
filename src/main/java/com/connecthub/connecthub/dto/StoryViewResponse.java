package com.connecthub.connecthub.dto;

import java.time.LocalDateTime;

public class StoryViewResponse {
    private UserSummary user;
    private String slideId;
    private int count;
    private LocalDateTime viewedAt;

    public UserSummary getUser() { return user; }
    public void setUser(UserSummary user) { this.user = user; }
    public String getSlideId() { return slideId; }
    public void setSlideId(String slideId) { this.slideId = slideId; }
    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
    public LocalDateTime getViewedAt() { return viewedAt; }
    public void setViewedAt(LocalDateTime viewedAt) { this.viewedAt = viewedAt; }
}
