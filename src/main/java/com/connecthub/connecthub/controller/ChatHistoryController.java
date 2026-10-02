package com.connecthub.connecthub.controller;

import com.connecthub.connecthub.model.ChatMessage;
import com.connecthub.connecthub.repository.ChatMessageRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatHistoryController {

    private final ChatMessageRepository chatRepo;

    public ChatHistoryController(ChatMessageRepository chatRepo) {
        this.chatRepo = chatRepo;
    }

    @GetMapping("/history/{friendEmail}")
    public List<ChatMessage> getChatHistory(
            @PathVariable String friendEmail) {

        String myEmail = com.connecthub.connecthub.security.SecurityUtils.getCurrentUserEmail().orElse(null);
        if (myEmail == null)
            return List.of();

        return chatRepo
                .findBySenderAndReceiverOrReceiverAndSenderOrderByTimestampAsc(
                        myEmail, friendEmail,
                        friendEmail, myEmail);
    }
}
