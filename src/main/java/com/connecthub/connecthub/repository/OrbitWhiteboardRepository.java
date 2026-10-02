package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.OrbitWhiteboard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrbitWhiteboardRepository extends JpaRepository<OrbitWhiteboard, Long> {
    Optional<OrbitWhiteboard> findByRoomId(String roomId);
}
