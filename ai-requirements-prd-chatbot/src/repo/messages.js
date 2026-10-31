const COLS = 'id, project_id, role, content, client_request_id, created_at';

function check(error) { if (error) throw error; }

// All queries run through the user-scoped client, so RLS applies in addition to these filters.
export function messagesRepo(db) {
  return {
    async getProject(id) {
      const { data, error } = await db.from('projects').select('id').eq('id', id).maybeSingle();
      check(error); return data;
    },
    async countMessages(projectId) {
      const { count, error } = await db.from('messages').select('id', { count: 'exact', head: true }).eq('project_id', projectId);
      check(error); return count ?? 0;
    },
    async insertMessage(row) {
      const { data, error } = await db.from('messages').insert(row).select(COLS).single();
      if (error) { if (error.code === '23505') return { conflict: true }; throw error; }
      return { row: data };
    },
    async findByRequest(projectId, requestId, role) {
      const { data, error } = await db.from('messages').select(COLS)
        .eq('project_id', projectId).eq('client_request_id', requestId).eq('role', role).maybeSingle();
      check(error); return data;
    },
    async listRecent(projectId, limit) {
      const { data, error } = await db.from('messages').select(COLS).eq('project_id', projectId)
        .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit);
      check(error); return data.reverse();
    },
    async listPage(projectId, limit, before) {
      let q = db.from('messages').select(COLS).eq('project_id', projectId)
        .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit + 1);
      if (before) q = q.lt('created_at', before);
      const { data, error } = await q; check(error);
      const hasMore = data.length > limit;
      return { rows: data.slice(0, limit).reverse(), hasMore };
    },
    async touchProject(id) {
      const { error } = await db.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', id);
      check(error);
    },
  };
}
