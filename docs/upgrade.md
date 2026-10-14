# Upgrading to a real DB, auth, and realtime chat

This branch added a Prisma schema and a basic auth flow (JWT), and Socket.io-based realtime chat.

Quick start (local):

1. Copy .env.example to .env and set DATABASE_URL (Postgres) and JWT_SECRET.
2. Install dependencies: npm install
3. Generate Prisma client: npx prisma generate
4. Run migrations: npx prisma migrate dev --name init
5. Start dev server: npm run dev

Notes:
- The server uses JWT tokens stored in localStorage for the front-end demo. For production, use secure HttpOnly cookies.
- Socket.io passes the token in the auth payload (socket.io client default). The server verifies and attaches the user.
- The Prisma schema uses Postgres. For a quick local demo, you can use a local Postgres container with Docker.

Next steps I can implement:
- WebAuthn passwordless authentication
- OAuth providers and account linking
- Profile editing, avatar uploads and media storage
- Pagination, indexing and caching for feed queries
- Tests and CI

