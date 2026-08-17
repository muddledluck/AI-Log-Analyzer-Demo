import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});
import { cacheBackend, getCached, hashLog, setCached } from "./cache.js";
import { analyzeWithLlm } from "./llm.js";
import { gateIncidentLog, LOG_GATE_MESSAGE, parseLog } from "./parser.js";
import type { AnalyzeResponse } from "./types.js";

const PORT = Number(process.env.PORT ?? 4000);
const MAX_CHARS = 50_000;

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
  })
);
app.use(express.json({ limit: "80kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    cache: cacheBackend(),
    llm: Boolean(process.env.OPENAI_API_KEY) ? "live" : "mock",
  });
});

app.post("/api/analyze", async (req, res) => {
  const logText = typeof req.body?.logText === "string" ? req.body.logText : "";
  const trimmed = logText.trim();

  if (!trimmed) {
    res.status(400).json({ error: "Paste a log snippet first." });
    return;
  }
  if (trimmed.length > MAX_CHARS) {
    res.status(413).json({
      error: `This snippet is too large. Keep it under ${MAX_CHARS.toLocaleString()} characters — the error line plus the stack is enough.`,
    });
    return;
  }

  const hash = hashLog(trimmed);

  try {
    const parsed = parseLog(trimmed);
    const live = Boolean(process.env.OPENAI_API_KEY?.trim());

    if (!live) {
      const gate = gateIncidentLog(trimmed, parsed);
      if (!gate.ok) {
        res.status(400).json({ error: LOG_GATE_MESSAGE[gate.reason] });
        return;
      }
    }

    const cached = await getCached(hash);
    if (cached) {
      res.json({ ...cached, cached: true });
      return;
    }

    const outcome = await analyzeWithLlm(trimmed, parsed);

    if (outcome.kind === "reject") {
      res.status(400).json({ error: outcome.message });
      return;
    }

    if (outcome.source === "fallback") {
      const gate = gateIncidentLog(trimmed, parsed);
      if (!gate.ok) {
        res.status(400).json({
          error: outcome.error
            ? `${LOG_GATE_MESSAGE[gate.reason]} (${outcome.error})`
            : LOG_GATE_MESSAGE[gate.reason],
        });
        return;
      }
    }

    const result: AnalyzeResponse = {
      ...outcome.payload,
      cached: false,
      source: outcome.source,
      parsed,
      llmError: outcome.error,
    };

    if (outcome.source !== "fallback") {
      await setCached(hash, result);
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "The analyzer hit an unexpected problem. Try a shorter snippet.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Analyzer API on http://localhost:${PORT}`);
  console.log(`Cache: ${cacheBackend()} · LLM: ${process.env.OPENAI_API_KEY ? "live" : "mock"}`);
});
