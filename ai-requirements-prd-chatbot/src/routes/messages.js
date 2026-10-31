import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../errors.js';
import { parse, idParam } from '../validation.js';
import { messagesRepo } from '../repo/messages.js';
import { sendMessage } from '../services/chat.js';

const messageCreate = z.object({
  content: z.string().trim().min(1).max(8000),
  clientRequestId: z.string().uuid(),
}).strict();

const pageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime({ offset: true }).optional(),
});

export function messagesRouter({ llm, config }) {
  const r = Router({ mergeParams: true });
  const limits = {
    maxMessagesPerProject: config.MAX_MESSAGES_PER_PROJECT,
    historyCharBudget: config.HISTORY_CHAR_BUDGET,
    historyFetchLimit: 60,
  };
  const chatLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS, limit: config.CHAT_RATE_LIMIT_MAX,
    keyGenerator: (req) => req.user.id, standardHeaders: true, legacyHeaders: false,
    message: { error: 'Too many messages, slow down' },
  });

  r.get('/', asyncHandler(async (req, res) => {
    const projectId = parse(idParam, req.params.id);
    const { limit, before } = parse(pageQuery, req.query);
    const repo = messagesRepo(req.db);
    if (!(await repo.getProject(projectId))) throw new HttpError(404, 'Project not found');
    const { rows, hasMore } = await repo.listPage(projectId, limit, before);
    res.json({ messages: rows, nextBefore: hasMore ? rows[0].created_at : null });
  }));

  r.post('/', chatLimiter, asyncHandler(async (req, res) => {
    const projectId = parse(idParam, req.params.id);
    const { content, clientRequestId } = parse(messageCreate, req.body);
    const out = await sendMessage({ repo: messagesRepo(req.db), llm, limits, userId: req.user.id, projectId, content, requestId: clientRequestId });
    res.status(out.replayed ? 200 : 201).json({ userMessage: out.userMessage, assistantMessage: out.assistantMessage, replayed: out.replayed });
  }));

  return r;
}
