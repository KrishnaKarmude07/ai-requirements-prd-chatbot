import { ApiError } from './errors.js';

let getToken = async () => null;
export function setTokenProvider(fn) { getToken = fn; }

async function request(path, init = {}, as = 'json') {
  const token = await getToken();
  if (!token) throw new ApiError(401, 'Please sign in again.', 'NO_SESSION');
  let res;
  try {
    res = await fetch(path, { ...init, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
  } catch { throw new ApiError(0, 'Cannot reach the server.', 'NETWORK'); }
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch { /* non-JSON error */ }
    throw new ApiError(res.status, body.error ?? 'Request failed', body.code, body);
  }
  if (res.status === 204) return undefined;
  return as === 'blob' ? res.blob() : res.json();
}
const send = (method, body) => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  listProjects: () => request('/api/projects'),
  createProject: (name, description) => request('/api/projects', send('POST', { name, description })),
  getProject: (id) => request(`/api/projects/${id}`),
  updateProject: (id, patch) => request(`/api/projects/${id}`, send('PATCH', patch)),
  deleteProject: (id) => request(`/api/projects/${id}`, send('DELETE')),
  listMessages: (id, before) => request(`/api/projects/${id}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`),
  sendMessage: (id, content, clientRequestId) => request(`/api/projects/${id}/messages`, send('POST', { content, clientRequestId })),
  listPrdVersions: (id) => request(`/api/projects/${id}/prd`),
  getPrdVersion: (id, version) => request(`/api/projects/${id}/prd/versions/${version}`),
  generatePrd: (id) => request(`/api/projects/${id}/prd/generate`, send('POST', {})),
  editSection: (id, key, body, baseVersion) => request(`/api/projects/${id}/prd/sections/${key}`, send('PUT', { body, baseVersion })),
  regenerateSection: (id, key, baseVersion, instruction) =>
    request(`/api/projects/${id}/prd/sections/${key}/regenerate`, send('POST', { baseVersion, ...(instruction ? { instruction } : {}) })),
};
