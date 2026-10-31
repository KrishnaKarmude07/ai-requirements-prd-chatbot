const check = (error) => { if (error) throw error; };

export function prdRepo(db) {
  return {
    async getProject(id) {
      const { data, error } = await db.from('projects').select('id, name, description').eq('id', id).maybeSingle();
      check(error); return data;
    },
    // Atomic version assignment happens in the create_prd_version() SQL function.
    async createVersion(projectId, title, content) {
      const { data, error } = await db.rpc('create_prd_version', { p_project_id: projectId, p_title: title, p_content: content });
      if (error) { if (error.code === 'P0002') return null; throw error; }
      return data;
    },
    async getLatest(projectId) {
      const { data, error } = await db.from('prd_documents').select('*').eq('project_id', projectId)
        .order('version', { ascending: false }).limit(1).maybeSingle();
      check(error); return data;
    },
    async getVersion(projectId, version) {
      const { data, error } = await db.from('prd_documents').select('*').eq('project_id', projectId).eq('version', version).maybeSingle();
      check(error); return data;
    },
    async listVersions(projectId) {
      const { data, error } = await db.from('prd_documents').select('id, version, title, created_at')
        .eq('project_id', projectId).order('version', { ascending: false });
      check(error); return data;
    },
  };
}
