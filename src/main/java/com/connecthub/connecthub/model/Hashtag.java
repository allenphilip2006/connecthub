package com.connecthub.connecthub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "hashtags", uniqueConstraints = @UniqueConstraint(columnNames = {"name"}))
public class Hashtag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
