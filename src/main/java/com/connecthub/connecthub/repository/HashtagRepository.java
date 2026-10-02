package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.Hashtag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface HashtagRepository extends JpaRepository<Hashtag, Long> {
    Optional<Hashtag> findByName(String name);
    List<Hashtag> findByNameContainingIgnoreCase(String q);
    List<Hashtag> findByNameIn(Collection<String> names);
}
