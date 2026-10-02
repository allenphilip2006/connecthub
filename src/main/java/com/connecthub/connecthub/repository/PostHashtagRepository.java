package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.PostHashtag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostHashtagRepository extends JpaRepository<PostHashtag, Long> {
    List<PostHashtag> findByHashtagId(Long hashtagId);
    void deleteByPostId(Long postId);
}
