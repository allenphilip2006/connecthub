package com.connecthub.connecthub.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/secure")  // all secure endpoints under this
public class SecureController {

    @GetMapping("/test")
    public String secureTest() {
        return "JWT secured API working!";
    }
}
