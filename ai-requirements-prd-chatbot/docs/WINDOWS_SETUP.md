# Windows setup guide (Windows 10/11)

Use **PowerShell** unless a step shows a Command Prompt (CMD) variant. Every step has: action, command, expected result, check.

## 1. Install Node.js 22 LTS
- Action: install from https://nodejs.org (choose the LTS installer) or run `winget install OpenJS.NodeJS.LTS`. Close and reopen the terminal afterwards.
- Check: `node -v` prints `v22.x.x` (or higher) and `npm -v` prints a version.
- If `node` is not recognised: reopen the terminal, or reinstall and tick "Add to PATH".

## 2. Extract the project and open it
- Right-click `ai-requirements-prd-chatbot.zip` → Extract All (use a short path, e.g. `C:\dev`). Make sure you extract into a **new** folder: do not merge with files from older stage ZIPs.
- Open the folder in VS Code (`File → Open Folder`) or `cd C:\dev\ai-requirements-prd-chatbot` in the terminal.
- Check: `dir` shows `package.json`, `src`, `public`, `supabase`, `docs`.

## 3. Install dependencies (folder: project root, next to package.json)
```
npm install
```
Expected: ends with "added N packages" and no `ERR!`. Check: `dir node_modules` exists.
Fixes: wrong folder → `cd` into the folder containing `package.json`; network/proxy errors → retry on another network; very old Node → upgrade (step 1).

## 4. Set up Supabase (once)
Follow **docs/SUPABASE.md** (run the SQL, set auth options, copy URL + anon key). Do not skip the verification queries.

## 5. Get a Gemini API key and model
Follow **docs/GEMINI.md**.

## 6. Create your `.env` file (project root)
- PowerShell: `Copy-Item .env.example .env`  ·  CMD: `copy .env.example .env`
- Open it: `notepad .env`. Fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`. No quotes, no spaces around `=`.
- Check: `Get-Content .env | Select-String "SUPABASE_URL"` shows your URL.
- Never share or commit this file (`.gitignore` already excludes it).

## 7. Run the automated tests
```
npm test
```
Expected: all tests pass (`# fail 0`). Failures about missing modules mean step 3 was not completed.

## 8. Start the server
```
npm run dev
```
Expected: `Listening on :3000`. If it exits with "Invalid environment configuration: ...", the named variables are missing in `.env`.
Port in use (`EADDRINUSE`): set `PORT=3001` in `.env`, restart, and use that port below.

## 9. Check the health endpoint (second terminal)
- PowerShell: `Invoke-RestMethod http://localhost:3000/api/health`  ·  CMD: `curl.exe http://localhost:3000/api/health`
- Expected: `ok : True` / `{"ok":true}`.

## 10. Open the app
Browse to http://localhost:3000. You should see the landing page. If you see "Cannot reach the backend", the server is not running.

## 11. First run
Register → (confirm email if your Supabase project requires it) → log in → New project → chat → open "View / generate PRD". Then work through **docs/TESTING.md**.

## Stopping and restarting
`Ctrl+C` stops the server. After editing `.env`, restart `npm run dev` (changes are read at start-up).
