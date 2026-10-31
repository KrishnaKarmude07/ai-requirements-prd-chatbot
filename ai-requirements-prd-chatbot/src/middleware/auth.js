import { createClient } from '@supabase/supabase-js';
import { HttpError } from '../errors.js';

// Verifies the Supabase JWT and attaches a user-scoped client, so RLS is enforced on every query.
export function requireAuth(config) {
  return async (req, _res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) throw new HttpError(401, 'Missing bearer token');
      const db = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await db.auth.getUser(token);
      if (error || !data?.user) throw new HttpError(401, 'Invalid or expired token');
      req.user = { id: data.user.id, email: data.user.email };
      req.db = db;
      next();
    } catch (e) { next(e); }
  };
}
