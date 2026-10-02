# API Documentation

Base URL: http://localhost:62223/api

## Auth
- POST /users/register
- POST /users/login

## Users
- GET /users
- GET /users/profile
- GET /users/{id}
- PUT /users/profile (multipart)
- PUT /users/privacy
- PUT /users/settings/notifications
- PUT /users/settings/theme
- PUT /users/settings/language
- PUT /users/settings/2fa
- GET /users/search?query=
- POST /users/search/history/{id}
- GET /users/search/recent
- POST /users/follow/{id}
- POST /users/unfollow/{id}
- GET /users/following
- GET /users/followers
- GET /users/requests/pending
- POST /users/requests/accept/{followerId}
- POST /users/requests/reject/{followerId}

## Feed
- GET /feed?page=&size=

## Posts
- POST /posts (multipart)
- GET /posts/me
- GET /posts/user/{userId}
- PUT /posts/{id}
- DELETE /posts/{id}
- POST /posts/{id}/archive
- POST /posts/{id}/repost
- POST /posts/{id}/like
- GET /posts/{id}/likes
- POST /posts/{id}/save
- DELETE /posts/{id}/save
- GET /posts/saved

## Comments
- GET /posts/{id}/comments
- POST /posts/{id}/comment
- POST /posts/{id}/comments/{parentId}/reply
- DELETE /posts/comments/{commentId}
- POST /posts/comments/{commentId}/like
- POST /posts/comments/{commentId}/unlike

## Search
- GET /search/hashtags?q=
- GET /search/hashtags/{name}

## Notifications
- GET /notifications
- GET /notifications/unread
- PUT /notifications/{id}/read

## Chat (HTTP)
- POST /chat/send
- GET /chat/history?otherUserEmail=
- GET /chat/unread/{conversationId}

## WebSocket (STOMP)
- Endpoint: /ws
- Send: /app/chat.send
- Send: /app/chat.typing
- Subscribe: /user/queue/messages
- Subscribe: /user/queue/typing
- Subscribe: /user/queue/notifications
