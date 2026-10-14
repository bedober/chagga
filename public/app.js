document.getElementById('loadFeatures').addEventListener('click', async () => {
  const res = await fetch('/api/features');
  const features = await res.json();
  document.getElementById('output').innerHTML = `<strong>Features:</strong><ul>${features.map(f=>`<li>${f}</li>`).join('')}</ul>`;
});

async function loadPosts(){
  const res = await fetch('/api/posts');
  const posts = await res.json();
  const feed = document.getElementById('feed');
  feed.innerHTML = posts.map(p => `<div class="post"><strong>${escapeHtml(p.author)}</strong> <small>${new Date(p.created_at).toLocaleString()}</small><div>${escapeHtml(p.content)}</div></div>`).join('');
}

function escapeHtml(s){ return (''+s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

loadPosts();

document.getElementById('createPost').addEventListener('click', async () => {
  const author = document.getElementById('author').value || 'anon';
  const content = document.getElementById('content').value || '';
  if(!content) return alert('post cannot be empty');
  await fetch('/api/posts', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ author, content }) });
  document.getElementById('content').value = '';
  loadPosts();
});

// intentionally light JS — replace with full SPA in next iteration
