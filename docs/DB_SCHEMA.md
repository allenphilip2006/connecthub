# Database Schema

## users
- id INT PK
- username VARCHAR(50)
- email VARCHAR(100) UNIQUE
- password VARCHAR
- bio VARCHAR(300)
- profile_image VARCHAR
- created_at DATETIME
- active BOOLEAN
- banned BOOLEAN
- is_private BOOLEAN
- language VARCHAR(20)
- theme VARCHAR(20)
- notifications_enabled BOOLEAN
- two_factor_enabled BOOLEAN
- two_factor_secret VARCHAR

## posts
- id BIGINT PK
- content VARCHAR(1000)
- media_url VARCHAR(255)
- author_email VARCHAR
- post_type VARCHAR
- deleted BOOLEAN
- archived BOOLEAN
- created_at DATETIME
- like_count INT
- original_post_id BIGINT
- reposted_from_email VARCHAR

## comments
- id BIGINT PK
- post_id BIGINT
- author_email VARCHAR
- text VARCHAR
- created_at DATETIME
- parent_comment_id BIGINT
- likes_count INT

## post_likes
- id BIGINT PK
- userEmail VARCHAR
- postId BIGINT
- likedAt DATETIME

## followers
- id BIGINT PK
- follower_id BIGINT
- following_id BIGINT
- status VARCHAR(20)

## notifications
- id BIGINT PK
- recipient_email VARCHAR
- sender_email VARCHAR
- type VARCHAR
- post_id BIGINT
- is_read BOOLEAN
- created_at DATETIME

## conversations
- id BIGINT PK
- user1_email VARCHAR
- user2_email VARCHAR
- created_at DATETIME

## messages
- id BIGINT PK
- conversation_id BIGINT
- sender_email VARCHAR
- content VARCHAR
- is_read BOOLEAN
- media_url VARCHAR
- created_at DATETIME

## chat_messages
- id BIGINT PK
- sender VARCHAR
- receiver VARCHAR
- content VARCHAR(1000)
- timestamp DATETIME

## search_history
- id BIGINT PK
- searcher_email VARCHAR
- searched_user_id INT
- timestamp DATETIME

## saved_posts
- id BIGINT PK
- user_email VARCHAR
- post_id BIGINT
- saved_at DATETIME

## hashtags
- id BIGINT PK
- name VARCHAR(100) UNIQUE

## post_hashtags
- id BIGINT PK
- post_id BIGINT
- hashtag_id BIGINT
