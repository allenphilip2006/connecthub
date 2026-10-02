package com.connecthub.connecthub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "search_history")
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who is doing the searching
    @Column(nullable = false)
    private String searcherEmail;

    // The user profile that was clicked/viewed from search results
    @ManyToOne
    @JoinColumn(name = "searched_user_id", nullable = false)
    private User searchedUser;

    @Column(name = "searched_at", nullable = false)
    private LocalDateTime searchedAt;

    public SearchHistory() {
    }

    public SearchHistory(String searcherEmail, User searchedUser) {
        this.searcherEmail = searcherEmail;
        this.searchedUser = searchedUser;
        this.searchedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSearcherEmail() {
        return searcherEmail;
    }

    public void setSearcherEmail(String searcherEmail) {
        this.searcherEmail = searcherEmail;
    }

    public User getSearchedUser() {
        return searchedUser;
    }

    public void setSearchedUser(User searchedUser) {
        this.searchedUser = searchedUser;
    }

    public LocalDateTime getSearchedAt() {
        return searchedAt;
    }

    public void setSearchedAt(LocalDateTime searchedAt) {
        this.searchedAt = searchedAt;
    }
}
