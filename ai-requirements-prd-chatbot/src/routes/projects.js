import { Router } from 'express';
import { asyncHandler, HttpError } from '../errors.js';
import { parse, projectCreate, projectUpdate, idParam } from '../validation.js';

const COLS = 'id, name, description, status, created_at, updated_at';

function fail(error) {
  if (error) { console.error('DB error:', error.code); throw new HttpError(500, 'Database error'); }
}

export function projectsRouter() {
  const r = Router();

  r.get('/', asyncHandler(async (req, res) => {
    const { data, error } = await req.db.from('projects').select(COLS).order('updated_at', { ascending: false });
    fail(error);
    res.json({ projects: data });
  }));

  r.post('/', asyncHandler(async (req, res) => {
    const body = parse(projectCreate, req.body);
    const { data, error } = await req.db.from('projects').insert({ ...body, user_id: req.user.id }).select(COLS).single();
    fail(error);
    res.status(201).json({ project: data });
  }));

  r.get('/:id', asyncHandler(async (req, res) => {
    const id = parse(idParam, req.params.id);
    const { data, error } = await req.db.from('projects').select(COLS).eq('id', id).maybeSingle();
    fail(error);
    if (!data) throw new HttpError(404, 'Project not found'); // same response whether missing or not yours
    res.json({ project: data });
  }));

  r.patch('/:id', asyncHandler(async (req, res) => {
    const id = parse(idParam, req.params.id);
    const body = parse(projectUpdate, req.body);
    const { data, error } = await req.db.from('projects').update(body).eq('id', id).select(COLS).maybeSingle();
    fail(error);
    if (!data) throw new HttpError(404, 'Project not found');
    res.json({ project: data });
  }));

  r.delete('/:id', asyncHandler(async (req, res) => {
    const id = parse(idParam, req.params.id);
    const { data, error } = await req.db.from('projects').delete().eq('id', id).select('id');
    fail(error);
    if (!data?.length) throw new HttpError(404, 'Project not found');
    res.status(204).end();
  }));

  return r;
}
