package com.connecthub.connecthub.service;

import com.connecthub.connecthub.dto.UserResponse;
import com.connecthub.connecthub.model.Follower;
import com.connecthub.connecthub.model.SearchHistory;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.repository.FollowerRepository;
import com.connecthub.connecthub.repository.SearchHistoryRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;

@Service
public class UserService {

    @org.springframework.beans.factory.annotation.Value("${connecthub.profile.upload-dir:./uploads/profile/}")
    private String PROFILE_DIR;

    private final UserRepository userRepository;
    private final FollowerRepository followerRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, FollowerRepository followerRepository,
            SearchHistoryRepository searchHistoryRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.followerRepository = followerRepository;
        this.searchHistoryRepository = searchHistoryRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public User register(String username, String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(encoder.encode(password));

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public String login(String email, String password, String twoFactorCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (user.isTwoFactorEnabled()) {
            if (twoFactorCode == null || twoFactorCode.isBlank()) {
                throw new RuntimeException("2fa_required");
            }
            if (user.getTwoFactorSecret() == null || !user.getTwoFactorSecret().equals(twoFactorCode)) {
                throw new RuntimeException("invalid_2fa");
            }
        }

        return jwtUtil.generateToken(user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElse(null);

        List<User> users = userRepository.findAll()
                .stream()
                .filter(user -> !user.getEmail().equals(currentEmail))
                .toList();

        return mapAllToResponseWithContext(users, currentUser);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElse(null);

        List<User> users = userRepository.findByActiveTrueAndBannedFalseAndUsernameContainingIgnoreCase(query == null ? "" : query)
                .stream()
                .filter(user -> !user.getEmail().equals(currentEmail))
                .toList();

        return mapAllToResponseWithContext(users, currentUser);
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponseWithContext(user, user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserProfile(Long id, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponseWithContext(targetUser, currentUser);
    }

    @Transactional
    public UserResponse updateProfile(
            String email,
            String username,
            String bio,
            MultipartFile profileImage) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (username != null)
                user.setUsername(username);
            if (bio != null)
                user.setBio(bio);

            if (profileImage != null && !profileImage.isEmpty()) {

                Files.createDirectories(Paths.get(PROFILE_DIR));

                String originalName = profileImage.getOriginalFilename();
                String ext = "";
                if (originalName != null && originalName.contains(".")) {
                    ext = originalName.substring(originalName.lastIndexOf("."));
                }

                String fileName = UUID.randomUUID() + ext;
                Path filePath = Paths.get(PROFILE_DIR).resolve(fileName);

                Files.copy(profileImage.getInputStream(), filePath,
                        StandardCopyOption.REPLACE_EXISTING);

                user.setProfileImage("/uploads/profile/" + fileName);
            }

            User saved = userRepository.save(user);
            return mapToResponseWithContext(saved, saved);

        } catch (Exception e) {
            throw new RuntimeException("Profile update failed", e);
        }
    }

    @Transactional
    public void updatePrivacy(String email, boolean isPrivate) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPrivate(isPrivate);
        userRepository.save(user);
    }

    @Transactional
    public void updateNotifications(String email, boolean enabled) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setNotificationsEnabled(enabled);
        userRepository.save(user);
    }

    @Transactional
    public void updateFcmToken(String email, String token) {
        userRepository.findByEmail(email).ifPresent(u -> {
            u.setFcmToken(token);
            userRepository.save(u);
        });
    }

    @Transactional
    public void updateTheme(String email, String theme) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setTheme(theme);
        userRepository.save(user);
    }

    @Transactional
    public void updateLanguage(String email, String language) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setLanguage(language);
        userRepository.save(user);
    }

    @Transactional
    public String toggleTwoFactor(String email, boolean enabled) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setTwoFactorEnabled(enabled);
        if (enabled) {
            if (user.getTwoFactorSecret() == null || user.getTwoFactorSecret().isBlank()) {
                user.setTwoFactorSecret(generateTwoFactorCode());
            }
        } else {
            user.setTwoFactorSecret(null);
        }
        userRepository.save(user);
        return user.getTwoFactorSecret();
    }

    @Transactional
    public void recoverTwoFactor(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
    }

    private String generateTwoFactorCode() {
        int code = (int) (Math.random() * 900000) + 100000;
        return String.valueOf(code);
    }

    @Transactional
    public void deactivateAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional
    public void logSearchHistory(String searcherEmail, Long searchedUserId) {
        User searchedUser = userRepository.findById(searchedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!searcherEmail.equals(searchedUser.getEmail())) {
            SearchHistory history = searchHistoryRepository
                    .findBySearcherEmailAndSearchedUser_Id(searcherEmail, searchedUserId)
                    .orElse(new SearchHistory(searcherEmail, searchedUser));

            history.setSearchedAt(java.time.LocalDateTime.now());
            searchHistoryRepository.save(history);
        }
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getRecentSearches(String email) {
        User currentUser = userRepository.findByEmail(email).orElse(null);
        List<SearchHistory> histories = searchHistoryRepository.findRecentSearches(email, PageRequest.of(0, 5));
        List<User> users = histories.stream()
                .map(SearchHistory::getSearchedUser)
                .collect(Collectors.toList());
        return mapAllToResponseWithContext(users, currentUser);
    }

    @Transactional
    public void deleteSearchHistory(String email, Long searchedUserId) {
        searchHistoryRepository.deleteBySearcherEmailAndSearchedUserId(email, searchedUserId);
    }

    @Transactional
    public void clearSearchHistory(String email) {
        searchHistoryRepository.deleteBySearcherEmail(email);
    }

    public List<UserResponse> mapAllToResponseWithContext(List<User> users, User currentUser) {
        if (users == null || users.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> userIds = users.stream()
                .map(User::getId)
                .collect(Collectors.toSet());

        Map<Long, Long> followerCounts = followerRepository.countFollowerMapByIds(userIds);
        Map<Long, Long> followingCounts = followerRepository.countFollowingMapByIds(userIds);

        Map<Long, Follower> followStatusById = new HashMap<>();
        Set<Long> followingSet = new HashSet<>();
        if (currentUser != null) {
            List<Follower> followStatusList = followerRepository.findByFollowerIdAndFollowingIdIn(
                    currentUser.getId(), userIds);
            for (Follower f : followStatusList) {
                followStatusById.put(f.getFollowingId(), f);
                followingSet.add(f.getFollowingId());
            }
        }

        List<UserResponse> result = new ArrayList<>(users.size());
        for (User user : users) {
            UserResponse dto = new UserResponse();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            dto.setEmail(user.getEmail());
            dto.setBio(user.getBio());
            dto.setProfileImage(user.getProfileImage());
            dto.setCreatedAt(user.getCreatedAt());
            dto.setPrivate(user.isPrivate());
            dto.setLanguage(user.getLanguage());
            dto.setTheme(user.getTheme());
            dto.setNotificationsEnabled(user.isNotificationsEnabled());
            dto.setTwoFactorEnabled(user.isTwoFactorEnabled());

            dto.setFollowersCount(followerCounts.getOrDefault(user.getId(), 0L));
            dto.setFollowingCount(followingCounts.getOrDefault(user.getId(), 0L));

            if (currentUser != null) {
                dto.setFollowing(followingSet.contains(user.getId()));
                Follower f = followStatusById.get(user.getId());
                if (f != null) {
                    dto.setFollowStatus(f.getStatus());
                } else {
                    dto.setFollowStatus("NONE");
                }
            } else {
                dto.setFollowStatus("NONE");
            }

            result.add(dto);
        }
        return result;
    }

    private UserResponse mapToResponseWithContext(User user, User currentUser) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setBio(user.getBio());
        dto.setProfileImage(user.getProfileImage());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setPrivate(user.isPrivate());
        dto.setLanguage(user.getLanguage());
        dto.setTheme(user.getTheme());
        dto.setNotificationsEnabled(user.isNotificationsEnabled());
        dto.setTwoFactorEnabled(user.isTwoFactorEnabled());

        dto.setFollowersCount(followerRepository.countByFollowingId(user.getId()));
        dto.setFollowingCount(followerRepository.countByFollowerId(user.getId()));

        if (currentUser != null) {
            dto.setFollowing(followerRepository.existsByFollowerIdAndFollowingId(
                    currentUser.getId(), user.getId()));

            followerRepository.findByFollowerIdAndFollowingId(currentUser.getId(), user.getId())
                    .ifPresentOrElse(
                            follower -> dto.setFollowStatus(follower.getStatus()),
                            () -> dto.setFollowStatus("NONE"));
        } else {
            dto.setFollowStatus("NONE");
        }

        return dto;
    }
}
