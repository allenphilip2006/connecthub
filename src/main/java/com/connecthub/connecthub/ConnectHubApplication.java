package com.connecthub.connecthub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableCaching
public class ConnectHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConnectHubApplication.class, args);
    }
}
        
