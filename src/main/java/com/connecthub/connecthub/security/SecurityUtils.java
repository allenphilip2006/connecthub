package com.connecthub.connecthub.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Optional;

public class SecurityUtils {

    public static Optional<String> getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        String email = null;

        if (principal instanceof String) {
            email = (String) principal;
        }

        if (email == null || email.equals("anonymousUser")) {
            return Optional.empty();
        }

        return Optional.of(email);
    }
}
