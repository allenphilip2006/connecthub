package com.connecthub.connecthub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.Map;

@RestController
@RequestMapping("/api/orbit")
public class OrbitController {

    @org.springframework.beans.factory.annotation.Value("${connecthub.orbit.upload-dir:./uploads/orbit/}")
    private String ORBIT_DIR;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
        }
        try {
            Files.createDirectories(Paths.get(ORBIT_DIR));
            String original = file.getOriginalFilename();
            String ext = "";
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf(".")).toLowerCase();
            }
            long sizeKb = file.getSize() / 1024;
            if (sizeKb > 50 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "File too large (max 50MB)"));
            }
            String name = java.util.UUID.randomUUID() + ext;
            Path path = Paths.get(ORBIT_DIR).resolve(name);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            String url = "/uploads/orbit/" + name;
            return ResponseEntity.ok(Map.of(
                    "url", url,
                    "size", file.getSize(),
                    "name", name
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
}
