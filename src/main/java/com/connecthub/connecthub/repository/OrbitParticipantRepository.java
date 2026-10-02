package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.OrbitParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrbitParticipantRepository extends JpaRepository<OrbitParticipant, Long> {
    List<OrbitParticipant> findByRoomId(String roomId);
    Optional<OrbitParticipant> findByRoomIdAndUserEmail(String roomId, String userEmail);
    void deleteByRoomIdAndUserEmail(String roomId, String userEmail);
    long countByRoomId(String roomId);
}
