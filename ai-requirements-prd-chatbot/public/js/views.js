import { api } from './api.js';
import { signIn, signUp, signOut } from './auth.js';
import { ApiError, friendlyMessage, timeAgo, mergeMessages } from './errors.js';
import { escapeHtml as esc, renderMarkdown, prdToMarkdown } from './markdown.js';

const STATUSES = ['draft', 'in_progress', 'review', 'completed', 'archived'];
const alertBox = (msg, kind = 'danger') => `<div class="alert alert-${kind}" role="alert">${esc(msg)}</div>`;
const $ = (root, sel) => root.querySelector(sel);
const go = (hash) => { location.hash = hash; };
// Navigate; if the hash is unchanged (so no hashchange event fires), re-render the current view instead.
const nav = (ctx, hash) => { if (location.hash === hash) ctx.reload(); else location.hash = hash; };

export function errorView(root, e, back = '#/dashboard') {
  const notFound = e instanceof ApiError && e.status === 404;
  root.innerHTML = `<h1 class="h4">${notFound ? 'Not found' : 'Something went wrong'}</h1>${alertBox(notFound ? 'This project does not exist or you do not have access to it.' : friendlyMessage(e))}<a class="btn btn-primary" href="${back}">Back to dashboard</a>`;
}

/* ---------- Landing ---------- */
export function landingView(root, signedIn) {
  const cta = signedIn ? '<a class="btn btn-primary btn-lg" href="#/dashboard">Go to dashboard</a>' : '<a class="btn btn-primary btn-lg" href="#/register">Start for free</a> <a class="btn btn-outline-secondary btn-lg" href="#/login">Log in</a>';
  const features = [
    ['Guided interview', 'The assistant asks one focused question at a time and adapts to your answers.'],
    ['Gap detection', 'Ambiguous, contradictory, duplicate and missing requirements are flagged for you.'],
    ['Structured PRD', 'User stories, acceptance criteria, risks, constraints, priorities and success metrics.'],
    ['Edit and regenerate', 'Edit any section by hand or ask the AI to rewrite just that section.'],
    ['Version history', 'Every change is saved as a new version you can reopen later.'],
    ['Private by design', 'Your projects are protected by Supabase accounts and Row Level Security.'],
  ];
  root.innerHTML = `<section class="hero text-center"><h1 class="display-5 fw-bold">Turn a rough idea into a professional PRD</h1>
    <p class="lead text-muted mx-auto mw-lead">Many product ideas stall because the requirements are vague, incomplete or contradictory. PRD Pilot interviews you, finds the gaps, and writes the document.</p><p class="mt-4">${cta}</p></section>
    <section class="row g-3" aria-label="Features">${features.map(([t, d]) => `<div class="col-md-4"><div class="card h-100"><div class="card-body"><h2 class="h6">${esc(t)}</h2><p class="mb-0 text-muted">${esc(d)}</p></div></div></div>`).join('')}</section>`;
}

/* ---------- Login / Register ---------- */
export function authView(root, mode) {
  const login = mode === 'login';
  root.innerHTML = `<div class="row justify-content-center"><div class="col-md-5 col-lg-4"><h1 class="h3 mb-3">${login ? 'Log in' : 'Create your account'}</h1><div id="msg" aria-live="polite"></div>
    <form id="f" novalidate><div class="mb-3"><label class="form-label" for="email">Email</label><input class="form-control" id="email" type="email" autocomplete="email" required></div>
    <div class="mb-3"><label class="form-label" for="pw">Password</label><input class="form-control" id="pw" type="password" minlength="8" autocomplete="${login ? 'current-password' : 'new-password'}" required><div class="form-text">${login ? '' : 'At least 8 characters.'}</div></div>
    <button class="btn btn-primary w-100" id="btn" type="submit">${login ? 'Log in' : 'Sign up'}</button></form>
    <p class="mt-3 mb-0">${login ? 'No account? <a href="#/register">Sign up</a>' : 'Already registered? <a href="#/login">Log in</a>'}</p></div></div>`;
  $(root, '#f').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = $(root, '#email').value.trim(), pw = $(root, '#pw').value, msg = $(root, '#msg'), btn = $(root, '#btn');
    if (!email || pw.length < 8) { msg.innerHTML = alertBox('Enter a valid email and a password of at least 8 characters.'); return; }
    btn.disabled = true; msg.innerHTML = '';
    try {
      if (login) { await signIn(email, pw); go('#/dashboard'); }
      else {
        const r = await signUp(email, pw);
        if (r.needsConfirmation) msg.innerHTML = alertBox('Account created. Check your email and click the confirmation link, then log in.', 'success');
        else go('#/dashboard');
      }
    } catch (e) { msg.innerHTML = alertBox(e.message || 'Authentication failed.'); }
    finally { btn.disabled = false; }
  });
}

/* ---------- Dashboard ---------- */
export async function dashboardView(root, ctx) {
  root.innerHTML = '<p class="text-muted" role="status">Loading projects…</p>';
  let projects;
  try { ({ projects } = await api.listProjects()); } catch (e) { if (ctx.alive()) errorView(root, e, '#/'); return; }
  if (!ctx.alive()) return;
  const draw = () => {
    root.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3"><h1 class="h3 mb-0">Your projects</h1><a class="btn btn-primary" href="#/new">New project</a></div><div id="msg" aria-live="polite"></div>` +
      (projects.length === 0 ? '<div class="card card-body text-center"><p class="mb-2">No projects yet.</p><div><a class="btn btn-primary" href="#/new">Create your first project</a></div></div>' :
        `<div class="row g-3">${projects.map((p) => `<div class="col-md-6"><div class="card h-100"><div class="card-body">
          <h2 class="h5"><a href="#/project/${p.id}">${esc(p.name)}</a></h2><p class="text-muted small mb-2">Updated ${esc(timeAgo(p.updated_at))}</p>
          <p class="mb-3">${esc(p.description || 'No description')}</p>
          <div class="d-flex flex-wrap gap-2 align-items-center"><label class="sr-only" for="st-${p.id}">Status</label>
          <select class="form-select form-select-sm w-auto" id="st-${p.id}" data-status="${p.id}">${STATUSES.map((s) => `<option value="${s}"${s === p.status ? ' selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}</select>
          <a class="btn btn-sm btn-primary" href="#/project/${p.id}">Open</a><button class="btn btn-sm btn-outline-secondary" data-rename="${p.id}">Rename</button><button class="btn btn-sm btn-outline-danger" data-delete="${p.id}">Delete</button></div></div></div></div>`).join('')}</div>`);
  };
  draw();
  root.addEventListener('change', async (ev) => {
    const id = ev.target.dataset?.status; if (!id) return;
    try { const { project } = await api.updateProject(id, { status: ev.target.value }); Object.assign(projects.find((p) => p.id === id), project); } catch (e) { $(root, '#msg').innerHTML = alertBox(friendlyMessage(e)); }
  });
  root.addEventListener('click', async (ev) => {
    const rename = ev.target.dataset?.rename, del = ev.target.dataset?.delete;
    try {
      if (rename) {
        const p = projects.find((x) => x.id === rename); const name = window.prompt('New project name', p.name);
        if (name && name.trim() && name.trim() !== p.name) { Object.assign(p, (await api.updateProject(rename, { name: name.trim() })).project); draw(); }
      } else if (del) {
        const p = projects.find((x) => x.id === del);
        if (window.confirm(`Delete "${p.name}" with all its messages and PRD versions? This cannot be undone.`)) { await api.deleteProject(del); projects.splice(projects.indexOf(p), 1); draw(); }
      }
    } catch (e) { $(root, '#msg').innerHTML = alertBox(friendlyMessage(e)); }
  });
}

/* ---------- New project ---------- */
export function newProjectView(root) {
  root.innerHTML = `<div class="row justify-content-center"><div class="col-md-7"><h1 class="h3 mb-3">New project</h1><div id="msg" aria-live="polite"></div>
    <form id="f"><div class="mb-3"><label class="form-label" for="name">Project name</label><input class="form-control" id="name" maxlength="120" required></div>
    <div class="mb-3"><label class="form-label" for="desc">Short description (optional)</label><textarea class="form-control" id="desc" rows="3" maxlength="2000"></textarea></div>
    <button class="btn btn-primary" id="btn" type="submit">Create and start interview</button> <a class="btn btn-link" href="#/dashboard">Cancel</a></form></div></div>`;
  $(root, '#f').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = $(root, '#name').value.trim(); if (!name) { $(root, '#msg').innerHTML = alertBox('Please enter a project name.'); return; }
    $(root, '#btn').disabled = true;
    try { const { project } = await api.createProject(name, $(root, '#desc').value.trim()); go(`#/project/${project.id}`); }
    catch (e) { $(root, '#msg').innerHTML = alertBox(friendlyMessage(e)); $(root, '#btn').disabled = false; }
  });
}

/* ---------- Chat workspace ---------- */
export async function workspaceView(root, ctx, id) {
  root.innerHTML = '<p class="text-muted" role="status">Loading conversation…</p>';
  let projects, project, first;
  try { [{ projects }, { project }, first] = await Promise.all([api.listProjects(), api.getProject(id), api.listMessages(id)]); }
  catch (e) { if (ctx.alive()) errorView(root, e); return; }
  if (!ctx.alive()) return;

  let messages = first.messages, nextBefore = first.nextBefore, pending = null, sending = false, error = null;
  root.innerHTML = `<div class="row g-3 g-xl-4"><aside class="col-md-3 col-xl-2" aria-label="Conversation history"><h2 class="h6 text-uppercase text-muted">Projects</h2>
    <div class="list-group side-list">${projects.map((p) => `<a class="list-group-item list-group-item-action${p.id === id ? ' active' : ''}" href="#/project/${p.id}"><div class="fw-semibold text-truncate">${esc(p.name)}</div><small>${esc(timeAgo(p.updated_at))}</small></a>`).join('')}</div>
    <a class="btn btn-sm btn-outline-primary mt-2 w-100" href="#/new">+ New project</a></aside>
    <section class="col-md-9 col-xl-7"><div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2"><div><div class="text-muted small mb-1">REQUIREMENTS INTERVIEW</div><h1 class="h4 mb-0">${esc(project.name)}</h1></div><a class="btn btn-primary btn-sm" href="#/project/${id}/prd">View / generate PRD</a></div>
    <div id="log" class="chat-log" role="log" aria-live="polite" aria-label="Conversation"></div><div id="err" class="mt-2" aria-live="assertive"></div>
    <form id="f" class="mt-2"><label class="sr-only" for="in">Your message</label><textarea id="in" class="form-control mb-2" rows="3" maxlength="8000" placeholder="Describe your idea or answer the question… (Enter to send, Shift+Enter for a new line)"></textarea>
    <div class="d-flex justify-content-between align-items-center gap-2"><span class="text-muted small">Enter to send · Shift+Enter for a new line</span><button id="send" class="btn btn-primary" type="submit">Send message</button></div></form></section>
    <aside class="col-xl-3 d-none d-xl-block" aria-label="Project context"><div class="inspector"><div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h6 mb-0">Project context</h2><span class="status-chip">${esc(project.status.replace('_', ' '))}</span></div>
      <p class="text-muted small">${esc(project.description || 'Add detail in the conversation to build a complete product brief.')}</p><div class="inspector-rule"></div>
      <h3 class="inspector-label">INTERVIEW GUIDE</h3><p class="small mb-2">Explore these areas as you shape the requirements:</p><ul class="inspector-list"><li>Who is this for?</li><li>What problem should it solve?</li><li>How will success be measured?</li><li>What constraints matter?</li></ul>
      <div class="inspector-rule"></div><h3 class="inspector-label">WORKSPACE</h3><div class="context-stat"><span>Messages</span><strong>${first.messages.length}${first.nextBefore ? '+' : ''}</strong></div><div class="context-stat"><span>PRD</span><a href="#/project/${id}/prd">Open document →</a></div>
    </div></aside></div>`;

  const log = $(root, '#log'), err = $(root, '#err'), input = $(root, '#in'), sendBtn = $(root, '#send');
  const bubble = (m) => m.role === 'assistant'
    ? `<div class="bubble bubble-assistant"><div class="bubble-meta">Assistant</div><div class="md">${renderMarkdown(m.content)}</div></div>`
    : `<div class="bubble bubble-user"><div class="bubble-meta">You</div>${esc(m.content)}</div>`;
  function drawLog(stick = true) {
    const showPending = pending && !messages.some((m) => m.role === 'user' && m.client_request_id === pending.id);
    log.innerHTML = (nextBefore ? '<button class="btn btn-sm btn-outline-secondary mb-2" data-older>Load older messages</button>' : '') +
      (messages.length === 0 && !pending ? '<div class="text-center text-muted py-5"><h2 class="h5">Describe your idea</h2><p>Write a rough description of what you want to build. The assistant asks one question at a time, and you can generate a PRD at any time, even with unknowns.</p></div>' : '') +
      messages.map(bubble).join('') +
      (showPending ? `<div class="bubble bubble-user bubble-pending"><div class="bubble-meta">You · not sent yet</div>${esc(pending.content)}</div>` : '') +
      (sending ? '<p class="text-muted" role="status">Assistant is thinking…</p>' : '');
    if (stick) log.scrollTop = log.scrollHeight;
  }
  function drawErr() {
    err.innerHTML = error ? `<div class="alert alert-danger d-flex justify-content-between align-items-center mb-0" role="alert"><span>${esc(friendlyMessage(error))}</span>${pending ? '<button class="btn btn-sm btn-outline-danger" data-retry>Retry</button>' : ''}</div>` : '';
  }
  async function deliver(content, requestId) {
    sending = true; error = null; pending = { id: requestId, content }; sendBtn.disabled = true; input.disabled = true; drawLog(); drawErr();
    try {
      const r = await api.sendMessage(id, content, requestId);
      messages = mergeMessages(messages, [r.userMessage, r.assistantMessage]); pending = null;
    } catch (e) {
      // The user message may already be saved when the AI fails; a retry reuses the same request id (no duplicates).
      if (e instanceof ApiError && e.data?.userMessage) messages = mergeMessages(messages, [e.data.userMessage]);
      error = e;
    } finally { sending = false; sendBtn.disabled = false; input.disabled = false; if (ctx.alive()) { drawLog(); drawErr(); if (!error) input.focus(); } }
  }
  $(root, '#f').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const content = input.value.trim(); if (!content || sending) return;
    input.value = ''; deliver(content, crypto.randomUUID());
  });
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); $(root, '#f').requestSubmit(); } });
  err.addEventListener('click', (ev) => { if (ev.target.dataset?.retry !== undefined && pending) deliver(pending.content, pending.id); });
  log.addEventListener('click', async (ev) => {
    if (ev.target.dataset?.older === undefined) return;
    try { const r = await api.listMessages(id, nextBefore); messages = mergeMessages(r.messages, messages); nextBefore = r.nextBefore; drawLog(false); }
    catch (e) { error = e; drawErr(); }
  });
  drawLog(); drawErr();
}

/* ---------- PRD preview / editor / versions ---------- */
export async function prdView(root, ctx, id, wantedVersion) {
  root.innerHTML = '<p class="text-muted" role="status">Loading PRD…</p>';
  let project, versions;
  try { [{ project }, { versions }] = await Promise.all([api.getProject(id), api.listPrdVersions(id)]); }
  catch (e) { if (ctx.alive()) errorView(root, e); return; }
  if (!ctx.alive()) return;
  const head = (extra = '') => `<div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2"><div><a href="#/project/${id}">&larr; Back to chat</a><h1 class="h4 mb-0">${esc(project.name)} · PRD</h1></div>${extra}</div><div id="msg" aria-live="polite"></div>`;

  if (versions.length === 0) {
    root.innerHTML = head() + '<div class="card card-body text-center"><p>No PRD yet. You can generate a preliminary PRD at any time; unknown details are marked TBD.</p><div><button id="gen" class="btn btn-primary">Generate PRD</button></div></div>';
    $(root, '#gen').addEventListener('click', async (ev) => {
      ev.target.disabled = true; ev.target.textContent = 'Generating… (up to a minute)';
      try { await api.generatePrd(id); nav(ctx, `#/project/${id}/prd`); }
      catch (e) { $(root, '#msg').innerHTML = alertBox(friendlyMessage(e)); ev.target.disabled = false; ev.target.textContent = 'Generate PRD'; }
    });
    return;
  }

  const latest = versions[0].version;
  const number = versions.some((v) => v.version === wantedVersion) ? wantedVersion : latest;
  let prd;
  try { ({ prd } = await api.getPrdVersion(id, number)); } catch (e) { if (ctx.alive()) errorView(root, e); return; }
  if (!ctx.alive()) return;
  const editable = prd.version === latest;

  root.innerHTML = head(`<div class="d-flex flex-wrap gap-2 align-items-center"><label class="sr-only" for="ver">Version</label>
      <select id="ver" class="form-select form-select-sm w-auto">${versions.map((v) => `<option value="${v.version}"${v.version === prd.version ? ' selected' : ''}>v${v.version}${v.version === latest ? ' (latest)' : ''} · ${esc(timeAgo(v.created_at))}</option>`).join('')}</select>
      <button id="copy" class="btn btn-sm btn-outline-secondary">Copy Markdown</button><button id="regen-all" class="btn btn-sm btn-outline-primary">Generate new full version</button></div>`) +
    (editable ? '' : alertBox(`You are viewing version ${prd.version}. Only the latest version (v${latest}) can be edited.`, 'warning')) +
    `<div class="row"><nav class="col-md-3 mb-3" aria-label="Table of contents"><div class="toc"><h2 class="h6 text-uppercase text-muted">Contents</h2>${prd.content.sections.map((s) => `<a href="#" data-scroll="sec-${s.key}">${esc(s.title)}</a>`).join('')}</div></nav>
    <article class="col-md-9 prd-doc"><h2 class="h3">${esc(prd.title)}</h2><p class="text-muted">Version ${prd.version}</p>${prd.content.sections.map((s) => `<section id="sec-${s.key}" data-key="${s.key}"><div class="d-flex justify-content-between align-items-start gap-2"><h3 class="h5">${esc(s.title)}</h3>
      ${editable ? `<div class="btn-group btn-group-sm" role="group" aria-label="Actions for ${esc(s.title)}"><button class="btn btn-outline-secondary" data-edit="${s.key}">Edit</button><button class="btn btn-outline-primary" data-regen="${s.key}">Regenerate</button></div>` : ''}</div>
      <div class="md" data-body="${s.key}">${renderMarkdown(s.body)}</div></section>`).join('')}</article></div>`;

  const msg = $(root, '#msg');
  const bodyOf = (k) => prd.content.sections.find((s) => s.key === k);
  $(root, '#ver').addEventListener('change', (ev) => { go(`#/project/${id}/prd?v=${ev.target.value}`); });
  $(root, '#copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(prdToMarkdown(prd)); msg.innerHTML = alertBox('Markdown copied to clipboard.', 'success'); } catch { msg.innerHTML = alertBox('Copy failed. Your browser blocked clipboard access.'); }
  });
  $(root, '#regen-all').addEventListener('click', async (ev) => {
    if (!window.confirm('Generate a completely new version from the conversation? Your current version stays in the history.')) return;
    ev.target.disabled = true; ev.target.textContent = 'Generating…'; msg.innerHTML = '';
    try { await api.generatePrd(id); nav(ctx, `#/project/${id}/prd`); }
    catch (e) { msg.innerHTML = alertBox(friendlyMessage(e)); ev.target.disabled = false; ev.target.textContent = 'Generate new full version'; }
  });
  const afterSave = (newPrd) => nav(ctx, `#/project/${id}/prd?v=${newPrd.version}`);
  root.addEventListener('click', async (ev) => {
    const t = ev.target; const scroll = t.dataset?.scroll;
    if (scroll) { ev.preventDefault(); document.getElementById(scroll)?.scrollIntoView({ behavior: 'smooth' }); return; }
    const ed = t.dataset?.edit, rg = t.dataset?.regen;
    if (ed) {
      const s = bodyOf(ed); const box = $(root, `[data-body="${ed}"]`);
      box.innerHTML = `<label class="sr-only" for="ta-${ed}">Edit ${esc(s.title)}</label><textarea id="ta-${ed}" class="form-control mb-2" rows="10" maxlength="8000">${esc(s.body)}</textarea><button class="btn btn-sm btn-primary" data-save="${ed}">Save as new version</button> <button class="btn btn-sm btn-link" data-cancel="${ed}">Cancel</button>`;
      $(root, `#ta-${ed}`).focus();
    } else if (t.dataset?.cancel) {
      const s = bodyOf(t.dataset.cancel); $(root, `[data-body="${t.dataset.cancel}"]`).innerHTML = renderMarkdown(s.body);
    } else if (t.dataset?.save) {
      const k = t.dataset.save, text = $(root, `#ta-${k}`).value.trim(); if (!text) { msg.innerHTML = alertBox('A section cannot be empty.'); return; }
      t.disabled = true;
      try { await afterSave((await api.editSection(id, k, text, prd.version)).prd); } catch (e) { msg.innerHTML = alertBox(friendlyMessage(e)); t.disabled = false; }
    } else if (rg) {
      const box = $(root, `[data-body="${rg}"]`);
      box.insertAdjacentHTML('beforebegin', `<div class="mb-2" data-regen-box="${rg}"><label class="form-label" for="in-${rg}">Optional instruction for the AI</label><input id="in-${rg}" class="form-control mb-2" maxlength="500" placeholder="e.g. focus on privacy risks"><button class="btn btn-sm btn-primary" data-run="${rg}">Regenerate section</button> <button class="btn btn-sm btn-link" data-cancel-regen="${rg}">Cancel</button></div>`);
      $(root, `#in-${rg}`).focus();
    } else if (t.dataset?.cancelRegen) {
      $(root, `[data-regen-box="${t.dataset.cancelRegen}"]`)?.remove();
    } else if (t.dataset?.run) {
      const k = t.dataset.run; t.disabled = true; t.textContent = 'Regenerating…'; msg.innerHTML = '';
      try { await afterSave((await api.regenerateSection(id, k, prd.version, $(root, `#in-${k}`).value.trim())).prd); }
      catch (e) { msg.innerHTML = alertBox(friendlyMessage(e)); t.disabled = false; t.textContent = 'Regenerate section'; }
    }
  });
}

/* ---------- Account ---------- */
export function accountView(root, session) {
  root.innerHTML = `<div class="row"><div class="col-md-6"><h1 class="h3">Account</h1><dl><dt>Email</dt><dd>${esc(session.user.email ?? '')}</dd></dl>
    <button id="out" class="btn btn-outline-danger">Log out</button><p class="text-muted small mt-3">Your projects, messages and PRDs are private to your account.</p></div></div>`;
  $(root, '#out').addEventListener('click', async () => { await signOut(); go('#/'); });
}
