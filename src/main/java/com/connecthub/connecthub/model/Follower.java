package com.connecthub.connecthub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "followers", indexes = {
    @Index(name = "idx_follower_status", columnList = "follower_id, status"),
    @Index(name = "idx_following_status", columnList = "following_id, status")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"follower_id", "following_id"})
})
public class Follower {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "follower_id", nullable = false)
    private Long followerId;

    @Column(name = "following_id", nullable = false)
    private Long followingId;

    @Column(nullable = false, length = 20)
    private String status = "ACCEPTED"; // PENDING, ACCEPTED, BLOCKED

    public Long getId() {
        return id;
    }

    public Long getFollowerId() {
        return followerId;
    }

    public void setFollowerId(Long followerId) {
        this.followerId = followerId;
    }

    public Long getFollowingId() {
        return followingId;
    }

    public void setFollowingId(Long followingId) {
        this.followingId = followingId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
