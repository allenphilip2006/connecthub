package com.connecthub.connecthub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "post_hashtags", uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "hashtag_id"}))
public class PostHashtag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "hashtag_id", nullable = false)
    private Long hashtagId;

    public Long getId() {
        return id;
    }
    public Long getPostId() {
        return postId;
    }
    public void setPostId(Long postId) {
        this.postId = postId;
    }
    public Long getHashtagId() {
        return hashtagId;
    }
    public void setHashtagId(Long hashtagId) {
        this.hashtagId = hashtagId;
    }
}
