# Production migration notes

I implemented a number of production-focused upgrades and infrastructure pieces to move the prototype toward a deployable architecture.

What I changed
- Refresh token support with HttpOnly cookies and Prisma storage of refresh tokens.
- Access tokens (short-lived) + refresh rotation on /api/auth/refresh.
- Replaced synchronous notification creation with a BullMQ queue (`notifications`) and a worker (worker.js) that persists notifications.
- Added rate limiting (`express-rate-limit`) for basic abuse mitigation.
- Added docker-compose.yml with Postgres and Redis services for local dev.
- Updated Prisma schema to include RefreshToken model; run migrations to create tables.
- Added cookie-parser and ioredis dependencies.

How to run locally (production/dev mix)
1. Copy `.env.example` → `.env` and set values (ensure REDIS_URL points to redis in docker-compose if using it)
2. Start Docker services: `docker compose up -d`
3. Install deps: `npm install`
4. Generate Prisma client: `npx prisma generate`
5. Run migrations: `npx prisma migrate dev --name production_ready`
6. Start the worker in a separate terminal: `npm run worker`
7. Start the app: `npm run dev`

Notes & next steps
- Worker and web server should be run in separate processes (or containers). For cross-process socket emission you'll need a pub/sub channel (Redis pub/sub) or socket.io adapter to broadcast from workers.
- Replace local file uploads with S3 presigned flows (I can implement that next).
- Add HttpOnly cookie support for refresh tokens already implemented — front-end needs a small change to use the `/api/auth/refresh` endpoint to obtain access tokens and store them in memory instead of localStorage.
- Add monitoring (Prometheus, logs), proper secrets management, and HTTPS termination.

If you want, I can next:
- Implement S3 presigned upload flow and remove local uploads (recommended)
- Wire a Redis adapter for socket.io so workers can emit notifications to connected sockets across instances
- Replace localStorage token flow and update front-end to use cookie-based refresh + in-memory access token
- Add CI/CD pipeline and Terraform scripts to provision managed Postgres/Redis and deploy the app

Tell me which of these you want and I will implement it in the same branch and open a PR when ready.
