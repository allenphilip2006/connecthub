package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.OrbitPoll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrbitPollRepository extends JpaRepository<OrbitPoll, Long> {
    Page<OrbitPoll> findByRoomIdOrderByCreatedAtDesc(String roomId, Pageable pageable);
}
