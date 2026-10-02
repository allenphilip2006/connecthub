package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.OrbitMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrbitMessageRepository extends JpaRepository<OrbitMessage, Long> {
    Page<OrbitMessage> findByRoomIdOrderByCreatedAtDesc(String roomId, Pageable pageable);
}
