# Testing Checklist

## API Unit Tests
- Users: register, login, profile get/update, privacy.
- Follows: follow/unfollow, pending requests.
- Posts: create, edit, delete, archive, repost.
- Likes: toggle like, like count.
- Comments: add, reply, delete, like/unlike.
- Saved: save/unsave, list.
- Notifications: list, unread count, mark read.
- Search: hashtags list and posts by hashtag.

## WebSocket Integration
- Auth handshake with JWT.
- Message send/receive routes.
- Typing indicator route.
- Notifications delivery route.

## UI/UX
- Navigation routes.
- Loading states and error boundaries.
- Responsive layout across breakpoints.

## Performance
- Feed pagination.
- Lazy loading of media.
- Bundle size via Vite build.

## Security
- JWT storage and expiry handling.
- Input validation for payloads.
- CORS policy enforcement.
- Rate limiting (proxy/web server).

## Accessibility
- alt text for images.
- color contrast and focus states.
- keyboard navigation in forms.
