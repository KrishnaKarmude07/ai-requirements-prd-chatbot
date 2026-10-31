import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../errors.js';
import { parse, idParam } from '../validation.js';
import { SECTION_KEYS, MAX_SECTION_CHARS } from '../prompts/prd.js';
import { prdRepo } from '../repo/prd.js';
import { messagesRepo } from '../repo/messages.js';
import { generatePrd, editSection, regenerateSection } from '../services/prd.js';

const keyParam = z.enum(SECTION_KEYS);
const versionParam = z.coerce.number().int().positive();
const baseVersion = z.number().int().positive();
const editBody = z.object({ body: z.string().trim().min(1).max(MAX_SECTION_CHARS), baseVersion }).strict();
const regenBody = z.object({ instruction: z.string().trim().max(500).optional(), baseVersion }).strict();

export function prdRouter({ llm, config }) {
  const r = Router({ mergeParams: true });
  const limits = { transcriptCharBudget: config.PRD_TRANSCRIPT_CHAR_BUDGET, maxOutputTokens: config.PRD_MAX_OUTPUT_TOKENS, timeoutMs: config.PRD_TIMEOUT_MS };
  const aiLimiter = rateLimit({ windowMs: config.RATE_LIMIT_WINDOW_MS, limit: config.PRD_RATE_LIMIT_MAX, keyGenerator: (req) => req.user.id, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many PRD requests, slow down' } });
  const deps = (req) => ({ prdRepo: prdRepo(req.db), msgRepo: messagesRepo(req.db), llm, limits, projectId: parse(idParam, req.params.id) });

  r.get('/', asyncHandler(async (req, res) => {
    const { prdRepo: repo, projectId } = deps(req);
    if (!(await repo.getProject(projectId))) throw new HttpError(404, 'Project not found');
    res.json({ versions: await repo.listVersions(projectId) });
  }));

  r.get('/versions/:version', asyncHandler(async (req, res) => {
    const { prdRepo: repo, projectId } = deps(req);
    const version = parse(versionParam, req.params.version);
    if (!(await repo.getProject(projectId))) throw new HttpError(404, 'Project not found');
    const prd = await repo.getVersion(projectId, version);
    if (!prd) throw new HttpError(404, 'Version not found');
    res.json({ prd });
  }));

  r.post('/generate', aiLimiter, asyncHandler(async (req, res) => {
    res.status(201).json({ prd: await generatePrd(deps(req)) });
  }));

  r.put('/sections/:key', asyncHandler(async (req, res) => {
    const key = parse(keyParam, req.params.key);
    const { body, baseVersion: bv } = parse(editBody, req.body);
    res.status(201).json({ prd: await editSection({ ...deps(req), key, body, baseVersion: bv }) });
  }));

  r.post('/sections/:key/regenerate', aiLimiter, asyncHandler(async (req, res) => {
    const key = parse(keyParam, req.params.key);
    const { instruction, baseVersion: bv } = parse(regenBody, req.body);
    res.status(201).json({ prd: await regenerateSection({ ...deps(req), key, instruction, baseVersion: bv }) });
  }));

  return r;
}
