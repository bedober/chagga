* { box-sizing: border-box; }

:root {
  --bg: #0b1020;
  --bg-soft: #121a2d;
  --panel: rgba(17, 24, 39, 0.84);
  --panel-strong: #111827;
  --card: #f8fafc;
  --text: #e5eefb;
  --muted: #9aa9c2;
  --line: rgba(255,255,255,0.08);
  --primary: #7c6cff;
  --primary-2: #00c2a8;
  --accent: #ff7a59;
  --success: #22c55e;
  --warning: #f59e0b;
}

html, body {
  margin: 0;
  min-height: 100%;
  background: radial-gradient(circle at top left, #16213f 0%, #0b1020 35%, #090d17 100%);
  color: var(--text);
  font-family: 'Inter', sans-serif;
}

body {
  display: flex;
  justify-content: center;
  padding: 24px;
}

button {
  border: none;
  cursor: pointer;
  font: inherit;
}

.app-shell {
  width: min(1500px, 100%);
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 340px;
  gap: 24px;
}

.sidebar,
.right-rail,
.content-area {
  min-width: 0;
}

.sidebar,
.right-rail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--line);
  border-radius: 18px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: white;
}

.brand-name {
  font-weight: 700;
  font-size: 1.15rem;
}

.brand-row small {
  color: var(--muted);
}

.main-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 18px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  color: var(--text);
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  transition: 0.2s ease;
}

.nav-item.active,
.nav-item:hover {
  background: rgba(124, 108, 255, 0.12);
  border: 1px solid rgba(124, 108, 255, 0.2);
}

.profile-card,
.card {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 18px;
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: white;
}

.avatar.large {
  width: 54px;
  height: 54px;
  font-size: 1.2rem;
}

.gradient-1 { background: linear-gradient(135deg, #ff7a59, #ffb067); }
.gradient-2 { background: linear-gradient(135deg, #7c6cff, #00c2a8); }
.gradient-3 { background: linear-gradient(135deg, #ec4899, #f59e0b); }

.user-name {
  font-weight: 600;
}

.user-tag {
  color: var(--muted);
  font-size: 0.9rem;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 8px;
}

.mini-stats div {
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 10px;
}

.mini-stats span {
  color: var(--muted);
  font-size: 0.68rem;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 8px 0;
}

.eyebrow {
  color: var(--primary-2);
  font-size: 0.75rem;
  letter-spacing: 0.08rem;
  text-transform: uppercase;
  font-weight: 700;
}

h1 {
  margin: 8px 0 0;
  font-size: clamp(2rem, 2.6vw, 3rem);
  line-height: 1.1;
}

.top-actions {
  display: flex;
  gap: 10px;
}

.primary-btn,
.ghost-btn {
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
}

.primary-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: white;
  box-shadow: 0 10px 20px rgba(124, 108, 255, 0.25);
}

.ghost-btn {
  background: rgba(255,255,255,0.04);
  color: var(--text);
  border: 1px solid var(--line);
}

.story-strip {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.story-item {
  min-width: 120px;
  border-radius: 18px;
  padding: 16px 12px;
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  min-height: 170px;
  box-shadow: inset 0px -50px 40px rgba(0,0,0,0.25);
}

.story-item small {
  opacity: 0.9;
}

.composer {
  background: rgba(255,255,255,0.035);
  border: 1px solid var(--line);
  border-radius: 22px;
}

.composer-header,
.composer-footer,
.panel-header,
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.composer-header {
  margin-bottom: 14px;
}

.composer-meta {
  display: flex;
  flex-direction: column;
}

textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(10, 15, 27, 0.6);
  color: var(--text);
  padding: 16px;
  font: inherit;
  margin-bottom: 12px;
}

.composer-footer {
  margin-top: 8px;
}

.composer-tools {
  display: flex;
  gap: 14px;
  color: var(--muted);
  font-size: 0.9rem;
}

.feed-panel {
  display: flex;
  flex-direction: column;
}

.section-header {
  margin: 6px 0 12px;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  color: var(--muted);
  padding: 7px 12px;
  font-size: 0.8rem;
}

.chip.active {
  background: rgba(124, 108, 255, 0.15);
  color: white;
  border-color: rgba(124, 108, 255, 0.25);
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 18px;
}

.post-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-badge {
  color: var(--primary-2);
  border: 1px solid rgba(0, 194, 168, 0.25);
  background: rgba(0, 194, 168, 0.08);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.74rem;
  font-weight: 600;
}

.post-content {
  color: #edf3fe;
  font-size: 1.01rem;
  line-height: 1.7;
  margin-bottom: 14px;
}

.post-metrics {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted);
  font-size: 0.92rem;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.post-metrics span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.right-rail {
  padding-top: 16px;
}

.panel {
  background: rgba(255,255,255,0.03);
}

.pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.72rem;
  font-weight: 700;
}

.pill.success { background: rgba(34, 197, 94, 0.15); color: #8ef0a5; }
.pill.neutral { background: rgba(255,255,255,0.05); color: var(--muted); }

.chat-list,
.community-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.chat-item,
.community-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--line);
}

.chat-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.chat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: #7c6cff;
}

.chat-copy {
  min-width: 0;
}

.chat-copy strong,
.community-copy strong {
  display: block;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-copy small,
.community-copy small {
  color: var(--muted);
}

.unread {
  background: var(--primary);
  color: white;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  gap: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.insight-panel ul {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar,
  .right-rail {
    order: 2;
  }

  .content-area {
    order: 1;
  }
}

@media (max-width: 680px) {
  body {
    padding: 12px;
  }

  .topbar,
  .composer-footer,
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .main-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
