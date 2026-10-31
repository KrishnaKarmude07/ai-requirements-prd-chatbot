import { setTokenProvider } from './api.js';

let client = null;

export async function initAuth() {
  let config;
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('bad status');
    config = await res.json();
  } catch { throw new Error('Cannot reach the backend. Start it with "npm run dev" and open http://localhost:3000'); }
  if (!window.supabase?.createClient) throw new Error('The Supabase browser library did not load (check your internet connection).');
  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  setTokenProvider(async () => (await client.auth.getSession()).data.session?.access_token ?? null);
  return client;
}

export const getSession = async () => (await client.auth.getSession()).data.session;
export async function signIn(email, password) { const { error } = await client.auth.signInWithPassword({ email, password }); if (error) throw error; }
export async function signUp(email, password) { const { data, error } = await client.auth.signUp({ email, password }); if (error) throw error; return { needsConfirmation: !data.session }; }
export async function signOut() { const { error } = await client.auth.signOut(); if (error) throw error; }
// Notify only when the signed-in user actually changes (ignores token refreshes and tab-focus events).
export function onUserChange(cb) {
  let last;
  client.auth.getSession().then(({ data }) => { last = data.session?.user?.id ?? null; });
  client.auth.onAuthStateChange((_e, s) => { const id = s?.user?.id ?? null; if (id !== last) { last = id; cb(id); } });
}
