# Gemini API configuration

1. Sign in with a Google account at **https://aistudio.google.com/apikey** and create an API key. Copy it into `GEMINI_API_KEY` in `.env`. Treat it like a password; never put it in frontend files or Git.
2. Choose a model your key can use: see https://ai.google.dev/gemini-api/docs/models. A "flash"-family text model is the usual choice for free-tier use. Put its exact name in `GEMINI_MODEL`. The name is deliberately **not** hard-coded because model availability changes.
3. Optional check that the model name is valid for your key (PowerShell; replace the value in the first line):
```
$k = "PASTE_YOUR_KEY"
(Invoke-RestMethod "https://generativelanguage.googleapis.com/v1beta/models" -Headers @{ "x-goog-api-key" = $k }).models | Where-Object { $_.supportedGenerationMethods -contains "generateContent" } | Select-Object -ExpandProperty name
```
Names are listed as `models/<name>`; use the part after `models/`. (Endpoint per Google's public documentation; confirm against the current docs if it returns an error.)
4. Restart the server after changing `.env`.

**Free tier:** whether a free tier is available, its rate limits, which models it covers, and how your data may be used depend on Google's current terms and your account's eligibility; none of this is guaranteed. If you see quota/rate-limit errors the app tells you to wait and retry. See https://ai.google.dev/gemini-api/docs.

All Gemini calls are made by `src/llm.js` on the server. The browser never sees the key.
