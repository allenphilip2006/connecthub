package com.connecthub.connecthub.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            // Check if already initialized
            if (FirebaseApp.getApps().isEmpty()) {
                // For local development, you might want to use a service account JSON file
                // Path to your service account key file
                // String path = "src/main/resources/serviceAccountKey.json";
                // FileInputStream serviceAccount = new FileInputStream(path);

                // For now, let's try to initialize using default credentials if available,
                // or skip if not configured.
                try {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.getApplicationDefault())
                            .build();
                    FirebaseApp.initializeApp(options);
                } catch (Exception e) {
                    System.err.println("Firebase Admin SDK could not be initialized with default credentials. Push notifications might fail.");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
