const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory demo store — replace with DB in production
const posts = [];
const users = [];

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', name: 'chagga-social', description: 'All-in-one social scaffold' });
});

app.get('/api/features', (req, res) => {
  // Short list for demo — full list in docs/architecture.md
  const features = [
    'Profiles (multi-persona)',
    'Follow / Friends / Groups',
    'Feed with explainable ranking & filters',
    'Real-time chat (E2E optional)',
    'Ephemeral stories & disappearing threads',
    'Communities & moderation tools (community-run)',
    'Cross-platform federation (ActivityPub-ready design)',
    'Creator monetization, tipping & micro-subscriptions',
    'Accessibility features (auto captions, alt-text helpers)',
    'Wellbeing tools (time metrics, cooldowns)'
  ];
  res.json(features);
});

app.get('/api/posts', (req, res) => {
  res.json(posts.slice().reverse());
});

app.post('/api/posts', (req, res) => {
  const { author = 'anon', content = '' } = req.body;
  const id = posts.length + 1;
  const post = { id, author, content, created_at: new Date().toISOString() };
  posts.push(post);
  res.status(201).json(post);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
