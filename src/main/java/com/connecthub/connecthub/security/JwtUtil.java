package com.connecthub.connecthub.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
//import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // 🔐 Secret key (must be 256-bit minimum for HS256)
    private static final String DEFAULT_SECRET =
            "connecthub_secret_key_256bit_long_for_security_123456";

    // ⏳ Token validity: 24 hours
    private static final long EXPIRATION_TIME =
            1000 * 60 * 60 * 24;

    // 🔑 Generate secure signing key
    private Key getSigningKey() {
        String env = System.getenv("CONNECTHUB_JWT_SECRET");
        String key = (env != null && !env.isBlank()) ? env : DEFAULT_SECRET;
        byte[] keyBytes = key.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ✅ Generate JWT token
    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis() + EXPIRATION_TIME)
                )
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ Extract email (username)
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    // ✅ Validate token
    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);

            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    // 🔒 Extract all claims safely
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
