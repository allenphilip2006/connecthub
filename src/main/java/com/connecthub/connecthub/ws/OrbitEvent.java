package com.connecthub.connecthub.ws;

public class OrbitEvent {
    private String type; // chat | whiteboard | poll_create | vote | spotlight | sync
    private String roomId;
    private String senderId;
    private Object payload;

    public OrbitEvent() {}

    public OrbitEvent(String type, String roomId, String senderId, Object payload) {
        this.type = type;
        this.roomId = roomId;
        this.senderId = senderId;
        this.payload = payload;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
