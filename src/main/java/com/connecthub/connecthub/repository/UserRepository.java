package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByUsernameContainingIgnoreCase(String query);

    List<User> findByActiveTrueAndBannedFalseAndUsernameContainingIgnoreCase(String query);

    List<User> findAllByEmailIn(Collection<String> emails);

    @Query("SELECT u FROM User u WHERE u.id IN :ids")
    List<User> findAllByIdIn(@Param("ids") Collection<Long> ids);

    default Map<String, User> mapByEmail(Collection<String> emails) {
        return findAllByEmailIn(emails).stream().collect(Collectors.toMap(User::getEmail, u -> u, (a, b) -> a));
    }

    default Map<Long, User> mapById(Collection<Long> ids) {
        return findAllByIdIn(ids).stream().collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
    }
}
