package com.connecthub.connecthub.repository;

import com.connecthub.connecthub.model.SearchHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    @Query("SELECT sh FROM SearchHistory sh WHERE sh.searcherEmail = :searcherEmail ORDER BY sh.searchedAt DESC")
    List<SearchHistory> findRecentSearches(String searcherEmail, Pageable pageable);

    Optional<SearchHistory> findBySearcherEmailAndSearchedUser_Id(String searcherEmail, Long searchedUserId);

    @Modifying
    @Transactional
    @Query("DELETE FROM SearchHistory sh WHERE sh.searcherEmail = :searcherEmail AND sh.searchedUser.id = :searchedUserId")
    void deleteBySearcherEmailAndSearchedUserId(
            @org.springframework.data.repository.query.Param("searcherEmail") String searcherEmail,
            @org.springframework.data.repository.query.Param("searchedUserId") Long searchedUserId);

    @Modifying
    @Transactional
    void deleteBySearcherEmail(String searcherEmail);
}
