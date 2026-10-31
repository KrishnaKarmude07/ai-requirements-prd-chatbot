# API reference

All endpoints except `/api/health` and `/api/config` require `Authorization: Bearer <Supabase access token>`. Errors: `{ "error": "message", "code": "OPTIONAL_CODE", ... }`.

| Status | Meaning |
|---|---|
| 400 `VALIDATION` | bad input | 401 | missing/invalid token | 404 | not found **or not yours** |
| 409 `STALE_VERSION`/`NO_PRD` | PRD changed / none yet | 413 | body too large | 422 `NO_CONVERSATION`/`CONVERSATION_TOO_LONG` |
| 429 | rate limited | 502 `LLM_FAILED`/`PRD_INVALID_OUTPUT` | AI problem (retryable) |

## Public
- `GET /api/health` → `{"ok":true}`
- `GET /api/config` → `{"supabaseUrl":"...","supabaseAnonKey":"..."}` (public values only)

## Projects
- `GET /api/projects` → `{"projects":[{id,name,description,status,created_at,updated_at}]}` (newest activity first)
- `POST /api/projects` body `{"name":"Resume Coach","description":"optional"}` → 201 `{"project":{...}}`
- `GET /api/projects/:id` → `{"project":{...}}`
- `PATCH /api/projects/:id` body any of `{"name","description","status"}` (status: draft|in_progress|review|completed|archived) → `{"project":{...}}`
- `DELETE /api/projects/:id` → 204 (cascades to messages and PRDs)

## Messages
- `GET /api/projects/:id/messages?limit=50&before=<ISO timestamp>` → `{"messages":[{id,project_id,role,content,client_request_id,created_at}],"nextBefore":"<timestamp>|null"}` (chronological; pass `nextBefore` as `before` for older pages)
- `POST /api/projects/:id/messages` body `{"content":"...(1-8000 chars)","clientRequestId":"<uuid>"}` → 201 `{"userMessage":{...},"assistantMessage":{...},"replayed":false}`
  - Retrying with the same `clientRequestId` never duplicates; a completed request returns 200 with `"replayed":true`.
  - Gemini failure → 502 `{"code":"LLM_FAILED","retryable":true,"reason":"quota|auth|model_not_found|timeout|blocked|empty|unavailable","userMessage":{...saved message...}}`

## PRDs (section keys: overview,goals,target_users,user_stories,functional_requirements,non_functional_requirements,acceptance_criteria,constraints,risks,priorities,success_metrics,open_questions)
- `GET /api/projects/:id/prd` → `{"versions":[{id,version,title,created_at}]}` (newest first)
- `GET /api/projects/:id/prd/versions/:n` → `{"prd":{id,project_id,version,title,content:{sections:[{key,title,body}]},created_at}}`
- `POST /api/projects/:id/prd/generate` (no body) → 201 `{"prd":{...}}` new version from the conversation (works with partial information; unknowns are TBD)
- `PUT /api/projects/:id/prd/sections/:key` body `{"body":"markdown","baseVersion":3}` → 201 `{"prd":{...version 4}}` (409 `STALE_VERSION` + `latestVersion` if 3 is no longer the latest)
- `POST /api/projects/:id/prd/sections/:key/regenerate` body `{"baseVersion":3,"instruction":"optional, max 500 chars"}` → 201 `{"prd":{...}}`

Limits: chat 10/min and PRD AI calls 5/min per user (configurable), 60 requests/min overall, 100 KB body, 500 messages per project.
