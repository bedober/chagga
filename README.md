# chagga — Social all-in-one (scaffold)

Make friends — a starting scaffold that combines major social-media features and adds missing, privacy & wellbeing focused features.

This repository branch contains a minimal runnable prototype and a design doc describing features to implement.

Tech stack (scaffold):
- Node.js + Express (backend API)
- Static frontend (plain HTML/JS) for quick demo (replace with React/Next/Tailwind in next iteration)
- In-memory data for demos (replace with PostgreSQL + Prisma or MongoDB in production)

How to run (locally):
- Clone the repo and checkout branch feat/social-scaffold
- npm install
- npm run dev
- Open http://localhost:3000

What's included in this branch:
- server.js — Express API with basic endpoints for posts and status
- public/index.html + public/app.js — frontend that consumes the API and lists the unified features
- docs/architecture.md — design doc with feature list (giant platform features + what they lack), architecture, schema suggestions and next steps
- package.json, .gitignore

Next steps I can take for you (pick any):
- Replace frontend with React/Next.js + Tailwind and implement auth flows
- Add real DB (Postgres) + Prisma schema and Docker compose
- Implement E2E encryption for direct messages and ephemeral threads
- Add feed ranking with explainable signals and user tuning controls
- Wire up ActivityPub-compatible federation

If you want, I can open a PR from this branch to your default branch once you review.
