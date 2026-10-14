const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');

require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

async function authFromHeader(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
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
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, username: user.username, displayName: user.displayName } });
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
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.displayName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/auth/me', authFromHeader, async (req, res) => {
  const u = req.user;
  res.json({ id: u.id, username: u.username, displayName: u.displayName, bio: u.bio });
});

// Users & follow
app.get('/api/users/:username', async (req, res) => {
  const username = req.params.username;
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true, displayName: true, bio: true, createdAt: true } });
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

// Posts
app.get('/api/posts', async (req, res) => {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { author: { select: { username: true, displayName: true } } } });
  res.json(posts.map(p => ({ id: p.id, content: p.content, author: p.author.displayName || p.author.username, createdAt: p.createdAt })));
});

app.post('/api/posts', authFromHeader, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  const post = await prisma.post.create({ data: { content, authorId: req.user.id } });
  res.status(201).json(post);
});

// Communities
app.get('/api/communities', async (req, res) => {
  const comms = await prisma.community.findMany({ orderBy: { members: 'desc' } });
  res.json(comms);
});

app.post('/api/communities', authFromHeader, async (req, res) => {
  const { name, topic, about } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const c = await prisma.community.create({ data: { name, topic, about } });
    res.status(201).json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    const payload = jwt.verify(token, JWT_SECRET);
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
  console.log(`user connected: ${socket.user.username}`);

  socket.on('chat:join', (room) => {
    socket.join(room);
  });

  socket.on('chat:message', async (data) => {
    // data: { room, content }
    const { room, content } = data;
    if (!room || !content) return;
    const msg = await prisma.message.create({ data: { room, content, senderId: socket.user.id } });
    io.to(room).emit('chat:message', { id: msg.id, room, content: msg.content, sender: { id: socket.user.id, username: socket.user.username }, createdAt: msg.createdAt });
  });

  socket.on('disconnect', () => {
    console.log(`disconnected: ${socket.user.username}`);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chagga app running on http://localhost:${PORT}`);
});
