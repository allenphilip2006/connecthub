package com.connecthub.connecthub.dto;

public class TypingDTO {
    private String sender;
    private String receiver;
    private boolean isTyping;

    // Getters & Setters
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }

    public boolean isTyping() { return isTyping; }
    public void setTyping(boolean typing) { isTyping = typing; }
}
