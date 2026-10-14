/* UI updates: profile editing, avatar upload, followers UI, notifications, creator & moderation panels
   This file integrates with the new server endpoints. It's intentionally minimal for the prototype.
*/

const state = {
  stories: [],
  posts: [],
  chats: [],
  communities: [],
  token: null,
  me: null,
  socket: null,
  currentRoom: null,
  notifications: []
};

// DOM refs
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
const composer = document.getElementById('composer');

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
                <small>${new Date(post.createdAt).toLocaleString()}</small>
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
  fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${state.token}` } }).then(r=>r.json()).then(data=>{
    if (data) {
      sideFollowers.textContent = data.followers || '—';
      sidePosts.textContent = data.posts || '—';
      state.me = Object.assign(state.me, data);
      // show creator / moderator panels
      if (state.me.isCreator) addCreatorPanel();
      if (state.me.isModerator) addModerationPanel();
      initSocket();
      loadNotifications();
    }
  }).catch(()=>{});
}

function addCreatorPanel(){
  const el = document.createElement('div');
  el.className = 'card panel';
  el.style.marginTop = '12px';
  el.innerHTML = `<h4>Creator Hub</h4><div id="creatorStats">Loading...</div>`;
  document.querySelector('.sidebar').appendChild(el);
  fetch('/api/creator/me', { headers: { 'Authorization': `Bearer ${state.token}` } }).then(r=>r.json()).then(data=>{
    document.getElementById('creatorStats').innerHTML = `Posts: ${data.posts} • Followers: ${data.followers} • Balance: $${data.walletBalance}`;
  }).catch(()=>{ document.getElementById('creatorStats').innerHTML = 'error'; });
}

function addModerationPanel(){
  const el = document.createElement('div');
  el.className = 'card panel';
  el.style.marginTop = '12px';
  el.innerHTML = `<h4>Moderator</h4><div id="moderationList">Loading...</div><button id="refreshModeration">Refresh</button>`;
  document.querySelector('.sidebar').appendChild(el);
  document.getElementById('refreshModeration').addEventListener('click', loadModeration);
  loadModeration();
}

async function loadModeration(){
  const res = await fetch('/api/moderation', { headers: { 'Authorization': `Bearer ${state.token}` } });
  if (!res.ok) return document.getElementById('moderationList').textContent = 'error';
  const list = await res.json();
  document.getElementById('moderationList').innerHTML = list.map(c => `<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${escapeHtml(c.contentRef)}</strong><br/><small>${escapeHtml(c.reason||'')}</small><div style="margin-top:6px"><button data-id="${c.id}" class="mod-keep">Keep</button><button data-id="${c.id}" class="mod-remove">Remove</button></div></div>`).join('');
  document.querySelectorAll('.mod-keep').forEach(b=>b.addEventListener('click', e=>moderationAction(e.target.dataset.id, 'keep')));
  document.querySelectorAll('.mod-remove').forEach(b=>b.addEventListener('click', e=>moderationAction(e.target.dataset.id, 'remove')));
}

async function moderationAction(id, decision){
  const res = await fetch(`/api/moderation/${id}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` }, body: JSON.stringify({ decision }) });
  if (!res.ok) return alert('action failed');
  loadModeration();
}

function initSocket() {
  if (!state.token) return;
  state.socket = io({ auth: { token: state.token } });
  state.socket.on('connect', () => console.log('socket connected'));
  state.socket.on('chat:history', (h) => {
    chatMessages.innerHTML = '';
    (h.messages || []).forEach(m => appendChatMessage(m));
  });
  state.socket.on('chat:message', (msg) => appendChatMessage(msg));
  state.socket.on('notification', (n) => { state.notifications.unshift(n); renderNotifications(); });
}

function joinRoom(room) {
  if (!state.socket) return alert('login first');
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
  el.innerHTML = `<strong>${escapeHtml(msg.sender.username)}</strong>: ${escapeHtml(msg.content)} <div style="font-size:0.8rem;color:var(--muted);">${new Date(msg.createdAt).toLocaleTimeString()}</div>`;
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

// Profile editing + avatar upload
function showProfileEditor(){
  const modal = document.createElement('div');
  modal.style.position='fixed'; modal.style.left=0; modal.style.top=0; modal.style.right=0; modal.style.bottom=0; modal.style.background='rgba(0,0,0,0.6)'; modal.style.display='grid'; modal.style.placeItems='center';
  modal.innerHTML = `<div style="background:#08101a;padding:20px;border-radius:12px; width:420px;"> <h3>Edit profile</h3> <input id="editDisplayName" placeholder="Display name" style="width:100%;margin-bottom:8px" value="${escapeHtml(state.me.displayName||'')}"> <textarea id="editBio" placeholder="Bio" style="width:100%;height:100px">${escapeHtml(state.me.bio||'')}</textarea> <div style="margin-top:8px"><input id="avatarFile" type="file" /></div> <div style="display:flex;gap:8px;margin-top:12px"><button id="saveProfile">Save</button><button id="cancelProfile">Cancel</button></div></div>`;
  document.body.appendChild(modal);
  document.getElementById('cancelProfile').addEventListener('click', ()=>document.body.removeChild(modal));
  document.getElementById('saveProfile').addEventListener('click', async ()=>{
    const displayName = document.getElementById('editDisplayName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` }, body: JSON.stringify({ displayName, bio }) });
    const f = document.getElementById('avatarFile');
    if (f.files.length) {
      const fd = new FormData(); fd.append('avatar', f.files[0]);
      await fetch('/api/profile/avatar', { method: 'POST', headers: { 'Authorization': `Bearer ${state.token}` }, body: fd });
    }
    document.body.removeChild(modal);
    // refresh
    fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${state.token}` } }).then(r=>r.json()).then(d=>{ state.me = Object.assign(state.me,d); sideName.textContent = state.me.displayName || state.me.username; sideTag.textContent = `@${state.me.username}`; sideFollowers.textContent = state.me.followers; sidePosts.textContent = state.me.posts; });
  });
}

// notifications
async function loadNotifications(){
  const res = await fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${state.token}` } });
  if (!res.ok) return;
  const notifs = await res.json();
  state.notifications = notifs;
  renderNotifications();
}

function renderNotifications(){
  // small badge in top actions
  let container = document.querySelector('.top-actions');
  let notifBtn = document.getElementById('notifBtn');
  if(!notifBtn){
    notifBtn = document.createElement('button'); notifBtn.id='notifBtn'; notifBtn.className='ghost-btn'; notifBtn.style.marginRight='8px'; notifBtn.textContent='Notifications';
    notifBtn.addEventListener('click', ()=>{
      const list = state.notifications.map(n=>`<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${escapeHtml(n.type)}</strong><div style="font-size:0.9rem;color:var(--muted)">${escapeHtml(JSON.stringify(n.data||{}))}</div></div>`).join('');
      const modal = document.createElement('div'); modal.style.position='fixed'; modal.style.left=0; modal.style.top=0; modal.style.right=0; modal.style.bottom=0; modal.style.background='rgba(0,0,0,0.6)'; modal.style.display='grid'; modal.style.placeItems='center'; modal.innerHTML = `<div style="background:#08101a;padding:20px;border-radius:12px; width:520px; max-height:80vh; overflow:auto"> <h3>Notifications</h3> ${list}</div>`; document.body.appendChild(modal); modal.addEventListener('click', ()=>document.body.removeChild(modal));
    });
    container.prepend(notifBtn);
  }
  if (state.notifications.length) notifBtn.textContent = `Notifications (${state.notifications.length})`;
}

// hydrate from token
const existingToken = localStorage.getItem('chagga_token');
if (existingToken) {
  state.token = existingToken;
  // fetch me
  fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${state.token}` } }).then(r=>r.json()).then(data=>{
    if (data && data.username) { state.me = data; onLoggedIn(); } else { localStorage.removeItem('chagga_token'); }
  }).catch(()=>{ localStorage.removeItem('chagga_token'); });
}

// wire up small profile edit trigger
const sideProfile = document.getElementById('sideProfile');
sideProfile.addEventListener('click', ()=>{ if (!state.me) return alert('login first'); showProfileEditor(); });

loadData();

loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', register);
