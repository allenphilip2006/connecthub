package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.UserResponse;
import com.connecthub.connecthub.model.Follower;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.repository.FollowerRepository;
import com.connecthub.connecthub.repository.UserRepository;
import com.connecthub.connecthub.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class FollowController {

        private final UserRepository userRepository;
        private final FollowerRepository followerRepository;
        private final NotificationService notificationService;

        public FollowController(UserRepository userRepository,
                        FollowerRepository followerRepository,
                        NotificationService notificationService) {
                this.userRepository = userRepository;
                this.followerRepository = followerRepository;
                this.notificationService = notificationService;
        }

        @PostMapping("/follow/{id}")
        public ResponseEntity<?> followUser(@PathVariable("id") Long followingId) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();

                User currentUser = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (followerRepository.existsByFollowerIdAndFollowingId(
                                currentUser.getId(), followingId)) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("status", "error", "message", "Already following"));
                }

                User followedUser = userRepository.findById(followingId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Follower follower = new Follower();
                follower.setFollowerId(currentUser.getId());
                follower.setFollowingId(followingId);

                if (followedUser.isPrivate()) {
                        follower.setStatus("PENDING");
                } else {
                        follower.setStatus("ACCEPTED");
                }

                followerRepository.save(follower);

                notificationService.createNotification(
                                followedUser.getEmail(),
                                currentUser.getEmail(),
                                follower.getStatus().equals("PENDING") ? "FOLLOW_REQUEST" : "FOLLOW",
                                null);

                if (follower.getStatus().equals("PENDING")) {
                        return ResponseEntity.ok(Map.of("status", "success", "message", "Follow request sent"));
                } else {
                        return ResponseEntity.ok(Map.of("status", "success", "message", "You are now following user with id " + followingId));
                }
        }

        @PostMapping("/unfollow/{id}")
        @Transactional
        public ResponseEntity<?> unfollowUser(@PathVariable("id") Long followingId) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();

                User currentUser = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                followerRepository.deleteByFollowerIdAndFollowingId(
                                currentUser.getId(), followingId);

                return ResponseEntity.ok(Map.of("message", "You have unfollowed (or cancelled request) to user with id " + followingId));
        }

        @PostMapping("/requests/accept/{followerId}")
        @Transactional
        public ResponseEntity<?> acceptRequest(@PathVariable Long followerId) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();

                User currentUser = userRepository.findByEmail(email).orElseThrow();

                Follower request = followerRepository
                                .findByFollowerIdAndFollowingId(followerId, currentUser.getId())
                                .orElseThrow(() -> new RuntimeException("Follow request not found"));

                request.setStatus("ACCEPTED");
                followerRepository.save(request);

                return ResponseEntity.ok(Map.of("message", "Follow request accepted"));
        }

        @PostMapping("/requests/reject/{followerId}")
        @Transactional
        public ResponseEntity<?> rejectRequest(@PathVariable Long followerId) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();

                User currentUser = userRepository.findByEmail(email).orElseThrow();

                followerRepository.deleteByFollowerIdAndFollowingId(followerId, currentUser.getId());

                return ResponseEntity.ok(Map.of("message", "Follow request rejected"));
        }

        @GetMapping("/requests/pending")
        public ResponseEntity<?> getPendingRequests() {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();

                User currentUser = userRepository.findByEmail(email).orElseThrow();

                List<Follower> pendingList = followerRepository.findByFollowingIdAndStatus(currentUser.getId(),
                                "PENDING");

                List<Long> followerIds = pendingList.stream()
                                .map(Follower::getFollowerId)
                                .collect(Collectors.toList());

                Map<Long, User> userMap = userRepository.mapById(followerIds);

                List<UserResponse> pendingUsers = pendingList.stream()
                                .map(f -> userMap.get(f.getFollowerId()))
                                .filter(u -> u != null)
                                .map(this::mapToUserResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(pendingUsers);
        }

        @GetMapping("/following")
        public ResponseEntity<?> getFollowing() {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();

                User currentUser = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                List<Follower> followingList = followerRepository.findByFollowerIdAndStatus(currentUser.getId(),
                                "ACCEPTED");

                List<Long> followingIds = followingList.stream()
                                .map(Follower::getFollowingId)
                                .collect(Collectors.toList());

                Map<Long, User> userMap = userRepository.mapById(followingIds);

                List<UserResponse> followingUsers = followingList.stream()
                                .map(f -> userMap.get(f.getFollowingId()))
                                .filter(u -> u != null)
                                .map(this::mapToUserResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(followingUsers);
        }

        @GetMapping("/followers")
        public ResponseEntity<?> getFollowers() {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();

                User currentUser = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                List<Follower> followersList = followerRepository.findByFollowingIdAndStatus(currentUser.getId(),
                                "ACCEPTED");

                List<Long> followerIds = followersList.stream()
                                .map(Follower::getFollowerId)
                                .collect(Collectors.toList());

                Map<Long, User> userMap = userRepository.mapById(followerIds);

                List<UserResponse> followers = followersList.stream()
                                .map(f -> userMap.get(f.getFollowerId()))
                                .filter(u -> u != null)
                                .map(this::mapToUserResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(followers);
        }

        private UserResponse mapToUserResponse(User u) {
                UserResponse ur = new UserResponse();
                ur.setId(u.getId());
                ur.setUsername(u.getUsername());
                ur.setEmail(u.getEmail());
                ur.setBio(u.getBio());
                ur.setProfileImage(u.getProfileImage());
                ur.setCreatedAt(u.getCreatedAt());
                return ur;
        }
}
