# Profile, uploads, notifications, and moderation

This commit adds the following features:

- Prisma schema upgrades: avatarUrl, isCreator, isModerator, walletBalance, Room, Message relation, Notification, ModerationCase
- Local avatar upload endpoint using multer; uploaded files are stored in public/uploads and user.avatarUrl updated
- Profile editing endpoint (/api/profile)
- Followers/following listing endpoints
- Creator dashboard endpoint (/api/creator/me)
- Notification creation & delivery (DB + socket emission)
- Moderation reporting endpoints and moderator-only listing/actions
- Room-based persistent chat with history (Room/Message models); socket join returns history
- Frontend updates for profile editing, avatar upload, notifications UI, creator & moderation panels

Notes / next steps:
- Run Prisma migration: `npx prisma migrate dev --name upgrade_profiles`
- For production, replace local uploads with S3-compatible storage and presigned uploads
- Consider background jobs for fan-out notifications to avoid request timeouts at scale
- Add tests and validation for file types, sizes and moderation inputs

