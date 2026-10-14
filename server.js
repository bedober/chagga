const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// File upload storage (local prototype)
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// BullMQ queue for notifications
const connection = new IORedis(REDIS_URL);
const notifQueue = new Queue('notifications', { connection });

// In-memory map of userId -> socket ids
const userSockets = new Map();

// Helper: enqueue notification job (worker will persist and emit)
async function enqueueNotification(userId, type, data) {
  await notifQueue.add('send', { userId, type, data });
}

function signAccessToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

async function authFromHeader(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'username already taken' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, email, password: hashed, displayName } });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    // store refresh token
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ accessToken, user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken, user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'no refresh token' });
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    // check DB
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored) return res.status(401).json({ error: 'invalid refresh token' });
    if (new Date(stored.expiresAt) < new Date()) {
      await prisma.refreshToken.delete({ where: { token } });
      return res.status(401).json({ error: 'refresh expired' });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'invalid token' });
    // rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });
    const newRefresh = signRefreshToken(user);
    await prisma.refreshToken.create({ data: { token: newRefresh, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    console.error('refresh err', err.message);
    return res.status(401).json({ error: 'invalid refresh token' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try { await prisma.refreshToken.delete({ where: { token } }); } catch (e) {}
  }
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

// Profile editing
app.post('/api/profile', authFromHeader, async (req, res) => {
  const { displayName, bio } = req.body;
  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { displayName, bio } });
    res.json({ ok: true, user: { id: user.id, displayName: user.displayName, bio: user.bio } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'update failed' });
  }
});

// Avatar upload
app.post('/api/profile/avatar', authFromHeader, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const url = `/uploads/${req.file.filename}`;
  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl: url } });
    res.json({ ok: true, avatarUrl: url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'update failed' });
  }
});

// Users & follow
app.get('/api/users/:username', async (req, res) => {
  const username = req.params.username;
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, createdAt: true, isCreator: true } });
  if (!user) return res.status(404).json({ error: 'not found' });

  const followers = await prisma.follow.count({ where: { followingId: user.id } });
  const following = await prisma.follow.count({ where: { followerId: user.id } });
  res.json({ ...user, followers, following });
});

app.post('/api/follow/:username', authFromHeader, async (req, res) => {
  const target = req.params.username;
  const me = req.user;
  const other = await prisma.user.findUnique({ where: { username: target } });
  if (!other) return res.status(404).json({ error: 'user not found' });
  if (other.id === me.id) return res.status(400).json({ error: 'cannot follow yourself' });

  try {
    const created = await prisma.follow.create({ data: { followerId: me.id, followingId: other.id } });
    // enqueue notification
    await enqueueNotification(other.id, 'follow', { from: { id: me.id, username: me.username } });
    res.json({ ok: true });
  } catch (err) {
    // duplicate -> unfollow
    if (err.code === 'P2002') {
      await prisma.follow.deleteMany({ where: { followerId: me.id, followingId: other.id } });
      return res.json({ ok: true, unfollowed: true });
    }
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Posts & feed (richer: supports tag filtering & simple "trending" by recent count)
app.get('/api/posts', async (req, res) => {
  const { tag } = req.query;
  let where = {};
  if (tag) where = { tags: { has: tag } };
  // simple ranking: recent posts first; future: add signals
  const posts = await prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100, include: { author: { select: { username: true, displayName: true, avatarUrl: true } } } });
  res.json(posts.map(p => ({ id: p.id, content: p.content, author: p.author.displayName || p.author.username, avatar: p.author.avatarUrl, tags: p.tags, createdAt: p.createdAt })));
});

app.post('/api/posts', authFromHeader, async (req, res) => {
  const { content, tags } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  const post = await prisma.post.create({ data: { content, tags: tags || [], authorId: req.user.id } });
  // enqueue notifications to followers
  const followers = await prisma.follow.findMany({ where: { followingId: req.user.id } });
  for (const f of followers) {
    await enqueueNotification(f.followerId, 'new_post', { postId: post.id, author: { id: req.user.id, username: req.user.username } });
  }
  res.status(201).json(post);
});

// Notifications endpoints
app.get('/api/notifications', authFromHeader, async (req, res) => {
  const notifs = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json(notifs);
});

app.post('/api/notifications/:id/read', authFromHeader, async (req, res) => {
  const id = req.params.id;
  await prisma.notification.update({ where: { id }, data: { read: true } });
  res.json({ ok: true });
});

// Moderation reporting
app.post('/api/report', authFromHeader, async (req, res) => {
  const { contentRef, reason } = req.body;
  if (!contentRef) return res.status(400).json({ error: 'contentRef required' });
  const mc = await prisma.moderationCase.create({ data: { reporterId: req.user.id, contentRef, reason } });
  // notify moderators (enqueue)
  const mods = await prisma.user.findMany({ where: { isModerator: true } });
  for (const m of mods) await enqueueNotification(m.id, 'moderation_report', { caseId: mc.id, contentRef });
  res.status(201).json(mc);
});

app.get('/api/moderation', authFromHeader, async (req, res) => {
  if (!req.user.isModerator) return res.status(403).json({ error: 'for moderators only' });
  const cases = await prisma.moderationCase.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json(cases);
});

app.post('/api/moderation/:id/action', authFromHeader, async (req, res) => {
  if (!req.user.isModerator) return res.status(403).json({ error: 'for moderators only' });
  const id = req.params.id;
  const { decision } = req.body; // e.g., 'remove' | 'keep'
  const mc = await prisma.moderationCase.update({ where: { id }, data: { status: 'resolved', decision, resolvedAt: new Date() } });
  res.json(mc);
});

// Socket.io auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  } catch (err) {
    console.error('socket auth err', err.message);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  // register socket
  const uid = socket.user.id;
  const arr = userSockets.get(uid) || [];
  arr.push(socket.id);
  userSockets.set(uid, arr);
  console.log(`user connected: ${socket.user.username} (${socket.id})`);

  socket.on('chat:join', async (roomName) => {
    if (!roomName) return;
    // find or create room
    let room = await prisma.room.findUnique({ where: { name: roomName } });
    if (!room) room = await prisma.room.create({ data: { name: roomName } });
    socket.join(room.name);

    // send recent history
    const messages = await prisma.message.findMany({ where: { roomId: room.id }, orderBy: { createdAt: 'asc' }, take: 200, include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } });
    socket.emit('chat:history', { room: room.name, messages: messages.map(m => ({ id: m.id, content: m.content, sender: { id: m.sender.id, username: m.sender.username }, createdAt: m.createdAt })) });
  });

  socket.on('chat:message', async (data) => {
    const { room: roomName, content } = data;
    if (!roomName || !content) return;
    let room = await prisma.room.findUnique({ where: { name: roomName } });
    if (!room) room = await prisma.room.create({ data: { name: roomName } });
    const msg = await prisma.message.create({ data: { roomId: room.id, content, senderId: socket.user.id } });
    const out = { id: msg.id, room: room.name, content: msg.content, sender: { id: socket.user.id, username: socket.user.username }, createdAt: msg.createdAt };
    io.to(room.name).emit('chat:message', out);
  });

  socket.on('disconnect', () => {
    const list = userSockets.get(uid) || [];
    userSockets.set(uid, list.filter(sid => sid !== socket.id));
    console.log(`disconnected: ${socket.user.username} (${socket.id})`);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chagga app running on http://localhost:${PORT}`);
});
