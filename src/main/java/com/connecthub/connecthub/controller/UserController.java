package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.dto.UserResponse;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

        private final UserService userService;

        public UserController(UserService userService) {
                this.userService = userService;
        }

        // ================= AUTH =================

        @PostMapping("/register")
        public ResponseEntity<?> register(@RequestBody User userRequest) {
                User user = userService.register(
                                userRequest.getUsername(),
                                userRequest.getEmail(),
                                userRequest.getPassword());

                return ResponseEntity.ok(
                                Map.of(
                                                "status", "success",
                                                "message", "User registered successfully",
                                                "userId", user.getId()));
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
                String email = payload.get("email");
                String password = payload.get("password");
                String code = payload.getOrDefault("code", null);

                try {
                        String token = userService.login(email, password, code);
                        return ResponseEntity.ok(
                                        Map.of(
                                                        "status", "success",
                                                        "token", token,
                                                        "email", email));
                } catch (RuntimeException ex) {
                        String message = ex.getMessage() == null ? "" : ex.getMessage();
                        if ("2fa_required".equals(message)) {
                                return ResponseEntity.status(403).body(Map.of("status", "2fa_required"));
                        }
                        if ("invalid_2fa".equals(message)) {
                                return ResponseEntity.status(403).body(Map.of("status", "invalid_2fa"));
                        }
                        return ResponseEntity.status(401).body(Map.of("status", "error"));
                }
        }

        // ================= GET ALL USERS (FOR CHAT SIDEBAR) =================

        @GetMapping
        public ResponseEntity<List<UserResponse>> getAllUsers() {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();

                return ResponseEntity.ok(
                                userService.getAllUsers(email));
        }

        @GetMapping("/search")
        public ResponseEntity<List<UserResponse>> searchUsers(
                        @RequestParam(required = false, defaultValue = "") String query) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();
                return ResponseEntity.ok(
                                userService.searchUsers(query, email));
        }

        @PostMapping("/search/history/{id}")
        public ResponseEntity<?> logSearchHistory(@PathVariable Long id) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email != null) {
                        userService.logSearchHistory(email, id);
                }
                return ResponseEntity.ok().build();
        }

        @GetMapping("/search/recent")
        public ResponseEntity<List<UserResponse>> getRecentSearches() {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();

                return ResponseEntity.ok(userService.getRecentSearches(email));
        }

        @DeleteMapping("/search/history/{id}")
        public ResponseEntity<Map<String, String>> deleteSearchHistory(@PathVariable Long id) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();
                userService.deleteSearchHistory(email, id);
                return ResponseEntity.ok(Map.of("message", "Search removed"));
        }

        @DeleteMapping("/search/history")
        public ResponseEntity<Map<String, String>> clearSearchHistory() {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null)
                        return ResponseEntity.status(401).build();
                userService.clearSearchHistory(email);
                return ResponseEntity.ok(Map.of("message", "Search history cleared"));
        }

        // ================= PROFILE =================

        @GetMapping("/profile")
        public ResponseEntity<UserResponse> getProfile() {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();

                return ResponseEntity.ok(
                                userService.getProfile(email));
        }

        @GetMapping("/{id}")
        public ResponseEntity<UserResponse> getUserProfile(@PathVariable Long id) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();

                return ResponseEntity.ok(
                                userService.getUserProfile(id, email));
        }

        @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<UserResponse> updateProfile(
                        @RequestParam(required = false) String username,
                        @RequestParam(required = false) String bio,
                        @RequestParam(required = false) MultipartFile profileImage) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();

                return ResponseEntity.ok(
                                userService.updateProfile(
                                                email,
                                                username,
                                                bio,
                                                profileImage));
        }

        @PutMapping("/privacy")
        public ResponseEntity<Map<String, String>> updatePrivacy(@RequestBody Map<String, Boolean> payload) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);

                if (email == null)
                        return ResponseEntity.status(401).build();

                boolean isPrivate = payload.getOrDefault("isPrivate", false);
                userService.updatePrivacy(email, isPrivate);

                return ResponseEntity.ok(Map.of("message", "Privacy settings updated successfully"));
        }

        @PutMapping("/settings/notifications")
        public ResponseEntity<Map<String, String>> notifications(@RequestBody Map<String, Boolean> payload) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null) return ResponseEntity.status(401).build();
                boolean enabled = payload.getOrDefault("enabled", true);
                userService.updateNotifications(email, enabled);
                return ResponseEntity.ok(Map.of("message", "Notification preferences updated"));
        }

        @PutMapping("/settings/fcm-token")
        public ResponseEntity<Map<String, String>> updateFcmToken(@RequestBody Map<String, String> payload) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null) return ResponseEntity.status(401).build();
                String token = payload.get("token");
                userService.updateFcmToken(email, token);
                return ResponseEntity.ok(Map.of("message", "FCM token updated"));
        }

        @PutMapping("/settings/theme")
        public ResponseEntity<Map<String, String>> theme(@RequestBody Map<String, String> payload) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null) return ResponseEntity.status(401).build();
                String theme = payload.getOrDefault("theme", "dark");
                userService.updateTheme(email, theme);
                return ResponseEntity.ok(Map.of("message", "Theme updated"));
        }

        @PutMapping("/settings/language")
        public ResponseEntity<Map<String, String>> language(@RequestBody Map<String, String> payload) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null) return ResponseEntity.status(401).build();
                String language = payload.getOrDefault("language", "en");
                userService.updateLanguage(email, language);
                return ResponseEntity.ok(Map.of("message", "Language updated"));
        }

        @PutMapping("/settings/2fa")
        public ResponseEntity<Map<String, String>> twoFactor(@RequestBody Map<String, Boolean> payload) {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null) return ResponseEntity.status(401).build();
                boolean enabled = payload.getOrDefault("enabled", false);
                String code = userService.toggleTwoFactor(email, enabled);
                if (enabled && code != null) {
                        return ResponseEntity.ok(Map.of("message", "Two-factor settings updated", "code", code));
                }
                return ResponseEntity.ok(Map.of("message", "Two-factor settings updated"));
        }

        @DeleteMapping("/delete")
        public ResponseEntity<Map<String, String>> deleteAccount() {
                String email = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
                if (email == null) return ResponseEntity.status(401).build();
                userService.deactivateAccount(email);
                return ResponseEntity.ok(Map.of("message", "Account deactivated"));
        }

        // ================= RECOVERY =================

        @PostMapping("/forgot-password")
        public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
                String email = payload.get("email");
                userService.requestPasswordReset(email);
                // In a real app, don't reveal if user exists.
                return ResponseEntity.ok(Map.of("message", "If an account exists, a reset link has been sent."));
        }

        @PostMapping("/reset-password")
        public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
                String email = payload.get("email"); // Should be from token
                String newPassword = payload.get("newPassword");
                userService.resetPassword(email, newPassword);
                return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        }

        @PostMapping("/recover-2fa")
        public ResponseEntity<?> recoverTwoFactor(@RequestBody Map<String, String> payload) {
                String email = payload.get("email");
                userService.recoverTwoFactor(email);
                return ResponseEntity.ok(Map.of("message", "Two-factor authentication has been disabled for your account. You can login now."));
        }
}
