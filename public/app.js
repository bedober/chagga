const state = {
  stories: [],
  posts: [],
  chats: [],
  communities: [],
  token: null,
  me: null,
  socket: null,
  currentRoom: null
};

const feedEl = document.getElementById('feed');
const storiesEl = document.getElementById('stories');
const chatListEl = document.getElementById('chatList');
const communityListEl = document.getElementById('communityList');
const postInput = document.getElementById('postInput');
const publishBtn = document.getElementById('publishPost');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const authArea = document.getElementById('authArea');
const sideName = document.getElementById('sideName');
const sideTag = document.getElementById('sideTag');
const sideFollowers = document.getElementById('sideFollowers');
const sidePosts = document.getElementById('sidePosts');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const chatRoomInput = document.getElementById('chatRoomInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatMessageInput = document.getElementById('chatMessageInput');
const chatMessages = document.getElementById('chatMessages');
const createCommunityBtn = document.getElementById('createCommunityBtn');
const communityName = document.getElementById('communityName');

function escapeHtml(s){ return (''+s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderStories(stories) {
  storiesEl.innerHTML = stories
    .map(
      (story) => `
        <article class="story-item" style="background: linear-gradient(160deg, ${story.color}, rgba(7,10,18,.7));">
          <div class="avatar gradient-3">${story.author[0]}</div>
          <strong>${story.author}</strong>
          <small>${story.tag}</small>
        </article>
      `
    )
    .join('');
}

function renderFeed(posts) {
  feedEl.innerHTML = posts
    .map(
      (post) => `
        <article class="post-card">
          <div class="post-top">
            <div class="post-author">
              <div class="avatar gradient-2">${escapeHtml(post.author[0])}</div>
              <div>
                <strong>${escapeHtml(post.author)}</strong><br />
                <small>${escapeHtml(post.createdAt)}</small>
              </div>
            </div>
            <span class="post-badge">Creator</span>
          </div>

          <div class="post-content">${escapeHtml(post.content)}</div>

        </article>
      `
    )
    .join('');
}

function renderChats(chats) {
  chatListEl.innerHTML = chats
    .map(
      (chat) => `
        <div class="chat-item" data-room="${chat.name}">
          <div class="chat-main">
            <div class="avatar" style="background:${chat.accent}; width: 34px; height: 34px; font-size: 0.75rem;">${chat.name[0]}</div>
            <div class="chat-copy">
              <strong>${chat.name}</strong>
              <small>${chat.preview}</small>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <small style="color: var(--muted);">${chat.status}</small>
            ${chat.unread ? `<span class="unread">${chat.unread}</span>` : ''}
          </div>
        </div>
      `
    )
    .join('');

  document.querySelectorAll('.chat-item').forEach(el => {
    el.addEventListener('click', () => {
      const room = el.getAttribute('data-room');
      joinRoom(room);
    });
  });
}

function renderCommunities(communities) {
  communityListEl.innerHTML = communities
    .map(
      (community) => `
        <div class="community-item">
          <div class="chat-main">
            <div class="avatar" style="background: linear-gradient(135deg, #22c55e, #0ea5e9); width: 34px; height: 34px; font-size: 0.75rem;">${community.name[0]}</div>
            <div class="community-copy">
              <strong>${community.name}</strong>
              <small>${community.topic || ''}</small>
            </div>
          </div>
          <span class="pill neutral">${community.members}</span>
        </div>
      `
    )
    .join('');
}

async function loadData() {
  const [storiesRes, postsRes, chatsRes, communitiesRes] = await Promise.all([
    fetch('/api/stories').catch(()=>({json:async()=>[]})),
    fetch('/api/posts').then(r=>r.json()).catch(()=>[]),
    fetch('/api/chats').then(r=>r.json()).catch(()=>[]),
    fetch('/api/communities').then(r=>r.json()).catch(()=>[])
  ]);

  const stories = await (storiesRes.json ? storiesRes.json() : storiesRes);
  state.stories = stories;
  state.posts = postsRes;
  state.chats = chatsRes;
  state.communities = communitiesRes;

  renderStories(state.stories);
  renderFeed(state.posts);
  renderChats(state.chats);
  renderCommunities(state.communities);
}

async function login() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return alert('enter credentials');
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  const body = await res.json();
  if (!res.ok) return alert(body.error || 'login failed');
  state.token = body.token;
  state.me = body.user;
  localStorage.setItem('chagga_token', state.token);
  onLoggedIn();
}

async function register() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return alert('enter credentials');
  const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, displayName: username }) });
  const body = await res.json();
  if (!res.ok) return alert(body.error || 'register failed');
  state.token = body.token;
  state.me = body.user;
  localStorage.setItem('chagga_token', state.token);
  onLoggedIn();
}

function onLoggedIn() {
  authArea.style.display = 'none';
  sideName.textContent = state.me.displayName || state.me.username;
  sideTag.textContent = `@${state.me.username}`;
  initSocket();
}

function initSocket() {
  if (!state.token) return;
  state.socket = io({ auth: { token: state.token } });
  state.socket.on('connect', () => {
    console.log('socket connected');
  });
  state.socket.on('chat:message', (msg) => {
    appendChatMessage(msg);
  });
}

function joinRoom(room) {
  if (!state.socket) return alert('login first');
  if (state.currentRoom) {
    // leave previous (socket.io leaves automatically when joining)
  }
  state.socket.emit('chat:join', room);
  state.currentRoom = room;
  chatMessages.innerHTML = '';
  appendSystemMessage(`Joined room: ${room}`);
}

function appendSystemMessage(text) {
  const el = document.createElement('div');
  el.style.opacity = 0.9;
  el.style.color = 'var(--muted)';
  el.style.padding = '6px 8px';
  el.textContent = text;
  chatMessages.appendChild(el);
}

function appendChatMessage(msg) {
  const el = document.createElement('div');
  el.style.padding = '8px';
  el.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
  el.innerHTML = `<strong>${escapeHtml(msg.sender.username)}:</strong> ${escapeHtml(msg.content)} <div style="font-size:0.8rem;color:var(--muted);">${new Date(msg.createdAt).toLocaleTimeString()}</div>`;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChatBtn.addEventListener('click', () => {
  const txt = chatMessageInput.value.trim();
  if (!txt || !state.currentRoom) return alert('join a room first');
  state.socket.emit('chat:message', { room: state.currentRoom, content: txt });
  chatMessageInput.value = '';
});

joinRoomBtn.addEventListener('click', () => {
  const room = chatRoomInput.value.trim();
  if (!room) return alert('enter a room');
  joinRoom(room);
});

createCommunityBtn.addEventListener('click', async () => {
  const name = communityName.value.trim();
  if (!name) return alert('enter a name');
  const res = await fetch('/api/communities', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` }, body: JSON.stringify({ name, topic: '' }) });
  if (!res.ok) return alert('failed to create');
  await loadData();
});

publishBtn.addEventListener('click', async () => {
  const content = postInput.value.trim();
  if (!content) return alert('post empty');
  const res = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` }, body: JSON.stringify({ content }) });
  if (!res.ok) return alert('post failed');
  postInput.value = '';
  await loadData();
});

loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', register);

// hydrate from token
const existingToken = localStorage.getItem('chagga_token');
if (existingToken) {
  state.token = existingToken;
  // fetch me
  fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${state.token}` } }).then(r=>r.json()).then(data=>{
    if (data && data.username) { state.me = data; onLoggedIn(); } else { localStorage.removeItem('chagga_token'); }
  }).catch(()=>{ localStorage.removeItem('chagga_token'); });
}

loadData();
