import { initAuth, getSession, signOut, onUserChange } from './auth.js';
import { landingView, authView, dashboardView, newProjectView, workspaceView, prdView, accountView, errorView } from './views.js';
import { escapeHtml } from './markdown.js';

const root = document.getElementById('app');
const nav = document.getElementById('nav');
let current = 0;

function drawNav(session) {
  nav.innerHTML = session
    ? '<li class="nav-item"><a class="nav-link" href="#/dashboard">Dashboard</a></li><li class="nav-item"><a class="nav-link" href="#/account">Account</a></li><li class="nav-item"><button id="logout" class="btn btn-sm btn-outline-secondary">Log out</button></li>'
    : '<li class="nav-item"><a class="nav-link" href="#/login">Log in</a></li><li class="nav-item"><a class="btn btn-sm btn-primary" href="#/register">Get started</a></li>';
  document.getElementById('logout')?.addEventListener('click', async () => { await signOut(); location.hash = '#/'; });
}

async function route() {
  const token = ++current;
  const ctx = { alive: () => token === current, reload: () => route() };
  const session = await getSession();
  drawNav(session);
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  const parts = path.split('/').filter(Boolean);
  const old = document.getElementById('app');
  const r = old.cloneNode(false); // fresh container: drops listeners from the previous view
  old.replaceWith(r);
  const protectedRoute = ['dashboard', 'new', 'project', 'account'].includes(parts[0]);
  try {
    if (protectedRoute && !session) { location.hash = '#/login'; return; }
    if ((parts[0] === 'login' || parts[0] === 'register') && session) { location.hash = '#/dashboard'; return; }
    if (!parts.length) landingView(r, !!session);
    else if (parts[0] === 'login' || parts[0] === 'register') authView(r, parts[0]);
    else if (parts[0] === 'dashboard') await dashboardView(r, ctx);
    else if (parts[0] === 'new') newProjectView(r);
    else if (parts[0] === 'account') accountView(r, session);
    else if (parts[0] === 'project' && parts[1] && parts[2] === 'prd') await prdView(r, ctx, parts[1], Number(new URLSearchParams(query).get('v')) || undefined);
    else if (parts[0] === 'project' && parts[1]) await workspaceView(r, ctx, parts[1]);
    else r.innerHTML = '<h1 class="h4">Page not found</h1><a href="#/">Go home</a>';
    r.focus?.();
  } catch (e) { if (ctx.alive()) errorView(r, e); }
}

(async function main() {
  try {
    await initAuth();
  } catch (e) {
    root.innerHTML = `<div class="alert alert-danger" role="alert">${escapeHtml(e.message)}</div>`;
    return;
  }
  onUserChange(() => route());
  window.addEventListener('hashchange', route);
  route();
})();
