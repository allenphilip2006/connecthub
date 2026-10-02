# Setup and Installation

## Prerequisites
- Java 17
- Maven
- MySQL
- Node.js 18+

## Backend
1. Create database `connecthub` in MySQL.
2. Update credentials in [application.properties](file:///c:/Users/allen/OneDrive/Documents/connecthub2.0/src/main/resources/application.properties).
3. Create folders:
   - C:/connecthub/uploads/
   - C:/connecthub/uploads/profile/
   - C:/connecthub/uploads/chat/
4. Build: `mvn -q -DskipTests package`
5. Run: `mvn spring-boot:run`

## Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Environment Variables
- JWT secret configured in code; for production, externalize to environment and use a secure key.

## WebSocket
- STOMP endpoint `/ws`, requires `Authorization: Bearer <token>` header.
