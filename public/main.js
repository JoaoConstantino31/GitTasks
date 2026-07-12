// Frontend logic: fetch user, repos, milestones and create tasks
const $ = id => document.getElementById(id);

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, { credentials: 'include', ...opts });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  return res.json().catch(() => ({}));
}

export async function init() {
  try {
    attachHandlers();
    await loadUser();
    await loadRepositories();
    routeFromHash(); 
  } catch (err) {
    console.error('init error', err);
    showError('#reposList', 'Failed to initialize app');
  }
}

function attachHandlers() {
  $('refreshRepos').addEventListener('click', loadRepositories);
  $('logoutBtn').addEventListener('click', logout);
  $('taskRepo').addEventListener('change', onTaskRepoChange);
  $('taskForm').addEventListener('submit', createTask);
  const repoSelect = $('repoSelect');
  const stateFilter = $('stateFilter');
  if (repoSelect) repoSelect.addEventListener('change', () => loadMilestones());
  if (stateFilter) stateFilter.addEventListener('change', () => loadMilestones());
  window.addEventListener('hashchange', routeFromHash);
}

async function loadUser() {
  try {
    const user = await apiFetch('/api/user');
    renderUser(user);
  } catch (err) {
    console.error('loadUser', err);
    // redirect to login if unauthorized
    if (err.message.startsWith('401')) window.location = '/login';
    else $('userEmail').textContent = 'Unknown';
  }
}

function renderUser(user) {
  $('userEmail').textContent = user.email || user.name || 'Unknown';
  const badge = $('roleBadge');
  badge.textContent = user.role || 'free';
  badge.className = `role-badge role-${(user.role || 'free')}`;
  renderPermissions(user.role || 'free');
  $('taskListGroup').style.display = user.role === 'premium' ? 'block' : 'none';

  const navUl = document.querySelector('.sidebar-section ul');
  if (navUl) {
    let navHtml = `
      <li><a href="#repos" onclick="showSection('repos')" class="nav-link">Repositories</a></li>
      <li><a href="#milestones" onclick="showSection('milestones')" class="nav-link">Milestones</a></li>
    `;
    if (user.role === 'regular' || user.role === 'premium') {
      navHtml += `
        <li><a href="#tasks" onclick="showSection('tasks')" class="nav-link">Create Task</a></li>
      `;
    }
    navUl.innerHTML = navHtml;
    routeFromHash();
  }
}

function renderPermissions(role) {
  const perms = {
    free: ['milestones:view'],
    regular: ['milestones:view','tasks:create'],
    premium: ['milestones:view','tasks:create','tasklist:create']
  }[role] || [];
  const ul = $('permissionsList');
  ul.innerHTML = perms.length ? perms.map(p => `<li><span class="permission-check">✓</span> ${p}</li>`).join('') : '<li>None</li>';
}

async function loadRepositories() {
  const container = $('reposList');
  container.className = 'repos-list loading';
  container.innerHTML = '<p>Loading repositories...</p>';
  try {
    const res = await apiFetch('/api/repos');
    const repos = res.repositories || res;
    if (!repos || repos.length === 0) {
      container.innerHTML = '<p class="placeholder">No repositories found</p>';
      return;
    }
    // render repo cards
    container.className = 'repos-list';
    container.innerHTML = repos.map(r => `
      <div class="repo-card">
        <div class="repo-header">
          <div>
            <h3>${escapeHtml(r.name)}</h3>
            <div class="repo-owner">${escapeHtml(r.owner)}</div>
          </div>
          <div><span class="badge ${r.private ? 'badge-private' : ''}">${r.private ? 'Private' : 'Public'}</span></div>
        </div>
        <div class="repo-description">${escapeHtml(r.description || '')}</div>
        <div class="repo-footer">
          <small>Updated: ${new Date(r.updated_at).toLocaleString()}</small>
          <div>
            <button class="btn btn-small" onclick="window.open('${r.url}', '_blank')">Open</button>
            <button class="btn btn-small" onclick="selectRepoForMilestones('${encodeURIComponent(r.owner)}','${encodeURIComponent(r.name)}')">Milestones</button>
          </div>
        </div>
      </div>
    `).join('');
    populateRepoSelects(repos);
  } catch (err) {
    console.error('loadRepositories', err);
    showError('#reposList', 'Failed to load repositories');
  }
}

function populateRepoSelects(repos) {
  const repoSelect = $('repoSelect');
  const taskRepo = $('taskRepo');
  const makeOptions = (el) => {
    el.innerHTML = '<option value="">Select a repository...</option>' + repos.map(r => `<option value="${encodeURIComponent(r.owner)}/${encodeURIComponent(r.name)}">${escapeHtml(r.fullName)}</option>`).join('');
  };
  makeOptions(repoSelect);
  makeOptions(taskRepo);
}

async function loadMilestones() {
  const sel = $('repoSelect');
  const val = sel.value;
  const state = $('stateFilter').value;
  const list = $('milestonesList');
  if (!val) {
    list.innerHTML = '<p class="placeholder">Select a repository to view milestones</p>';
    return;
  }
  const [ownerEnc, repoEnc] = val.split('/');
  const owner = decodeURIComponent(ownerEnc);
  const repo = decodeURIComponent(repoEnc);

  list.className = 'milestones-list loading';
  list.innerHTML = '<p>Loading milestones...</p>';
  try {
    const res = await apiFetch(`/api/milestones/${owner}/${repo}?state=${encodeURIComponent(state)}`);
    const milestones = res.milestones || res;
    if (!milestones || milestones.length === 0) {
      list.className = 'milestones-list';
      list.innerHTML = '<p class="placeholder">No milestones found</p>';
      return;
    }
    list.className = 'milestones-list';
    list.innerHTML = milestones.map(m => `
      <div class="milestone-card">
        <div class="milestone-header">
          <div><h4>${escapeHtml(m.title)}</h4></div>
          <div><span class="badge ${m.state === 'open' ? 'badge-open' : 'badge-closed'}">${m.state}</span></div>
        </div>
        <div class="milestone-description">${escapeHtml(m.description || '')}</div>
        <div class="milestone-stats">
          <div>Open: ${m.open_issues}</div>
          <div>Closed: ${m.closed_issues}</div>
          <div>Due: ${m.due_date ? new Date(m.due_date).toLocaleDateString() : '—'}</div>
        </div>
        <div class="milestone-footer">
          <small>Updated: ${new Date(m.updated_at).toLocaleString()}</small>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('loadMilestones', err);
    showError('#milestonesList', 'Failed to load milestones');
  }
}

function selectRepoForMilestones(ownerEnc, nameEnc) {
  const owner = decodeURIComponent(ownerEnc);
  const name = decodeURIComponent(nameEnc);
  $('repoSelect').value = `${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  showSection('milestones');
  loadMilestones();
}

async function onTaskRepoChange() {
  const v = $('taskRepo').value;
  const milestoneSelect = $('taskMilestone');
  milestoneSelect.innerHTML = '<option value="">Select a milestone...</option>';
  if (!v) return;
  const [ownerEnc, repoEnc] = v.split('/');
  const owner = decodeURIComponent(ownerEnc);
  const repo = decodeURIComponent(repoEnc);
  try {
    const res = await apiFetch(`/api/milestones/${owner}/${repo}?state=open`);
    const milestones = res.milestones || res;
    if (!milestones || milestones.length === 0) {
      milestoneSelect.innerHTML = '<option value="">No milestones</option>';
      return;
    }
    milestoneSelect.innerHTML = '<option value="">Select a milestone...</option>' + milestones.map(m => `<option value="${encodeURIComponent(JSON.stringify({number: m.id, title: m.title, due: m.due_date}))}">${escapeHtml(m.title)} ${m.due_date ? '- due ' + new Date(m.due_date).toLocaleDateString() : ''}</option>`).join('');
  } catch (err) {
    console.error('onTaskRepoChange', err);
    milestoneSelect.innerHTML = '<option value="">Failed to load</option>';
  }
}

async function createTask(ev) {
  ev.preventDefault();
  const repoVal = $('taskRepo').value;
  const msVal = $('taskMilestone').value;
  if (!repoVal || !msVal) return alert('Select repository and milestone');
  const [ownerEnc, repoEnc] = repoVal.split('/');
  const owner = decodeURIComponent(ownerEnc);
  const repo = decodeURIComponent(repoEnc);
  let meta;
  try { meta = JSON.parse(decodeURIComponent(msVal)); } catch (e) { meta = { title: msVal }; }

  const title = `${meta.title} — from ${repo}`;
  const notes = `Milestone ${meta.title}\nRepository: ${owner}/${repo}\nGenerated by GitTasks`;
  const listName = $('taskListName').value.trim(); 

  try {
    const payload = {
      listId: listName || null, 
      title,
      notes,
      due: meta.due || null
    };
    const res = await fetch('/api/tasks', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${res.statusText} ${t}`);
    }
    const data = await res.json();
    showTaskResult(true, `Task created: ${data.title || data.id}`);
  } catch (err) {
    console.error('createTask', err);
    showTaskResult(false, `Failed to create task: ${err.message}`);
  }
}

function showTaskResult(ok, message) {
  const el = $('taskResult');
  el.style.display = 'block';
  el.className = 'task-result ' + (ok ? 'result-success' : 'result-error');
  el.innerHTML = `<h4>${ok ? 'Success' : 'Error'}</h4><p>${escapeHtml(message)}</p>`;
  setTimeout(() => el.style.display = 'none', 8000);
}

async function logout() {
  try {
    await fetch('/logout', { method: 'POST', credentials: 'include' });
  } finally {
    window.location = '/login';
  }
}

function showError(selector, message) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

export function showSection(name) {
  // ativar secção
  document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
  const el = document.getElementById(name);
  if (el) el.classList.add('active');

  // ativar link
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  document.querySelectorAll(`.nav-link[href="#${name}"]`).forEach(a => a.classList.add('active'));

  // sincronizar hash
  if (location.hash !== `#${name}`) {
    location.hash = `#${name}`;
  }

  // ações ao entrar numa secção
  if (name === 'milestones') {
    // se já houver repo escolhido, recarrega com o filtro atual
    const sel = $('repoSelect');
    if (sel && sel.value) loadMilestones();
  }
}

function routeFromHash() {
  const name = (location.hash || '#repos').replace('#', '');
  showSection(name);
}

// Auto-init
window.addEventListener('DOMContentLoaded', () => init());
window.showSection = showSection;
window.selectRepoForMilestones = selectRepoForMilestones;
window.logout = logout;
window.loadMilestones = loadMilestones;