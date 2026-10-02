package com.connecthub.connecthub.ws;

import com.connecthub.connecthub.model.OrbitMessage;
import com.connecthub.connecthub.model.OrbitWhiteboard;
import com.connecthub.connecthub.repository.OrbitMessageRepository;
import com.connecthub.connecthub.repository.OrbitWhiteboardRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
public class OrbitWsController {
    private final SimpMessagingTemplate messagingTemplate;
    private final OrbitMessageRepository messageRepo;
    private final OrbitWhiteboardRepository whiteboardRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public OrbitWsController(SimpMessagingTemplate messagingTemplate,
                             OrbitMessageRepository messageRepo,
                             OrbitWhiteboardRepository whiteboardRepo) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepo = messageRepo;
        this.whiteboardRepo = whiteboardRepo;
    }

    @MessageMapping("/orbit/{roomId}")
    public void relay(@DestinationVariable String roomId, @Payload OrbitEvent event) {
        if (event == null) return;
        event.setRoomId(roomId);

        // Server-side persistence
        try {
            if ("chat".equals(event.getType()) && event.getPayload() instanceof Map) {
                Map<String, Object> payload = (Map<String, Object>) event.getPayload();
                OrbitMessage m = new OrbitMessage();
                m.setRoomId(roomId);
                m.setSenderEmail(String.valueOf(payload.getOrDefault("senderId", event.getSenderId())));
                m.setText(String.valueOf(payload.getOrDefault("text", "")));
                m.setMediaUrl((String) payload.get("mediaUrl"));
                messageRepo.save(m);
            } else if ("whiteboard".equals(event.getType())) {
                OrbitWhiteboard wb = whiteboardRepo.findByRoomId(roomId).orElse(null);
                if (wb == null) {
                    wb = new OrbitWhiteboard();
                    wb.setRoomId(roomId);
                }
                wb.setStrokesJson(mapper.writeValueAsString(event.getPayload()));
                wb.setUpdatedAt(LocalDateTime.now());
                whiteboardRepo.save(wb);
            }
        } catch (Exception e) {
            // Silently fail persistence, don't block relay
        }

        messagingTemplate.convertAndSend("/topic/orbit/" + roomId, event);
    }
}
