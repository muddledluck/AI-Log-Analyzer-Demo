# Sentinel — AI Log Analyzer & Auto-Fixer

Paste a crash log. Get a briefing: what broke, why it matters, and a suggested fix.

This is a small public demo for a portfolio — no accounts, no log storage beyond a short cache.

## Run it

```bash
npm install
npm run dev
```

- UI: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000/api/health](http://localhost:4000/api/health)

Click **Try example** if you do not have a log handy. The three samples are a Node checkout crash, a Python payment traceback, and a missing database URL.

## Plug in a real LLM (optional)

The UI works without a key. Mock briefings are pattern-matched from the parser so the demo is complete on its own.

1. Copy `server/env.example` to `server/.env`
2. Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`)
3. Restart the API

The call site is marked with a `TODO` in `server/src/llm.ts`. Swap the fetch URL if you use another provider.

## Redis / Upstash (optional)

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to cache analyses by SHA-256 of the log (1 hour TTL). Without them, the API uses an in-memory map.

## Layout

```
web/      Next.js App Router, TypeScript, Tailwind, shadcn/ui
server/   Express: parse → cache → LLM (or mock) → JSON briefing
```

## Deploy notes

Host `web` on Vercel (or similar) and `server` on any Node host. Set `NEXT_PUBLIC_API_URL` to the API origin and `CORS_ORIGIN` on the API to the site origin.
