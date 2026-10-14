const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const stories = [
  { id: 1, author: 'Aisha', tag: 'Travel', color: '#ff7a59', message: 'Sunrise in Kyoto' },
  { id: 2, author: 'Noah', tag: 'AI', color: '#7c6cff', message: 'AI for good' },
  { id: 3, author: 'Mila', tag: 'Design', color: '#22c55e', message: 'Fresh UI ideas' },
  { id: 4, author: 'Leo', tag: 'Music', color: '#f59e0b', message: 'Night session' },
  { id: 5, author: 'Sana', tag: 'Wellbeing', color: '#ec4899', message: 'Healthy routines' }
];

const posts = [
  {
    id: 1,
    author: 'Aisha',
    handle: '@aisha',
    time: '2m ago',
    mood: 'Travel',
    content: 'Built a city slow-travel guide with community recommendations. Better than algorithmic noise.',
    likes: 481,
    comments: 38,
    shares: 12,
    badge: 'Verified creator'
  },
  {
    id: 2,
    author: 'Dante',
    handle: '@dante',
    time: '15m ago',
    mood: 'Design',
    content: 'I want social feeds to explain why content is ranked, not just hide the logic behind engagement traps.',
    likes: 290,
    comments: 51,
    shares: 21,
    badge: 'Moderator'
  },
  {
    id: 3,
    author: 'Rae',
    handle: '@ray',
    time: '1h ago',
    mood: 'Privacy',
    content: 'Tiny but powerful feature: per-post audience rules, cooldowns for emotional replies, and easy export of your social graph.',
    likes: 612,
    comments: 96,
    shares: 33,
    badge: 'Privacy advocate'
  }
];

const chats = [
  { id: 1, name: 'Aisha', status: 'online', preview: 'I sent the route list to the group', unread: 2, accent: '#7c6cff' },
  { id: 2, name: 'Design guild', status: '12 online', preview: 'Next week: accessibility workshop', unread: 6, accent: '#22c55e' },
  { id: 3, name: 'Sana', status: 'away', preview: 'Can we add a better sleep-safe mode?', unread: 0, accent: '#f59e0b' },
  { id: 4, name: 'Noah', status: 'online', preview: 'Worked on the ranking explainers', unread: 3, accent: '#ec4899' }
];

const communities = [
  { id: 1, name: 'Future of Social', members: '18.2k', topic: 'UI, trust, privacy' },
  { id: 2, name: 'Creator Economy Lab', members: '9.4k', topic: 'Paywalls & fair splits' },
  { id: 3, name: 'Wellbeing & Focus', members: '7.1k', topic: 'Digital health' },
  { id: 4, name: 'Open Web & Federation', members: '5.8k', topic: 'Interoperability' }
];

const features = [
  'Profiles and multi-persona identities',
  'Feeds with transparent ranking controls',
  'Private DMs, communities, and live chat',
  'Stories + short-form content + threads',
  'Creator wallets and audience monetization',
  'Moderation tools and appeals',
  'Accessibility helpers and alt-text support',
  'Wellbeing prompts, sleep-safe writing, and time balance',
  'Easy export, import, and portability',
  'Federation-ready architecture'
];

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', app: 'Chagga Social', mode: 'prototype' });
});

app.get('/api/features', (req, res) => {
  res.json(features);
});

app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.get('/api/stories', (req, res) => {
  res.json(stories);
});

app.get('/api/chats', (req, res) => {
  res.json(chats);
});

app.get('/api/communities', (req, res) => {
  res.json(communities);
});

app.post('/api/posts', (req, res) => {
  const { author = 'You', handle = '@you', mood = 'General', content = '' } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Post content is required' });
  }

  const post = {
    id: Date.now(),
    author,
    handle,
    time: 'Just now',
    mood,
    content,
    likes: 0,
    comments: 0,
    shares: 0,
    badge: 'Creator'
  };

  posts.unshift(post);
  res.status(201).json(post);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Chagga app running on http://localhost:${PORT}`);
});

