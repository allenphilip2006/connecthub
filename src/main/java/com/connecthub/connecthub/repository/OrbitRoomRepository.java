package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.OrbitRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface OrbitRoomRepository extends JpaRepository<OrbitRoom, String> {
    List<OrbitRoom> findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime now);
    List<OrbitRoom> findByHostEmailOrderByCreatedAtDesc(String hostEmail);
}
