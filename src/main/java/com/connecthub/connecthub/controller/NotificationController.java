package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.Notification;
import com.connecthub.connecthub.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> myNotifications(Principal principal) {
        return service.getMyNotifications(principal.getName());
    }

    @GetMapping("/unread")
    public Map<String, Long> unread(Principal principal) {
        return Map.of("count", service.unreadCount(principal.getName()));
    }

    @PutMapping("/{id}/read")
    public void read(@PathVariable Long id) {
        service.markRead(id);
    }

    @PostMapping("/test-push")
    public void testPush(Principal principal) {
        service.sendTestNotification(principal.getName());
    }
}
