import { hasClassicRuntimeError } from "./parser.js";
import type { AnalysisPayload, ParsedLog, SuggestedDiff } from "./types.js";

const NODE_DIFF: SuggestedDiff = {
  filename: "src/services/userService.js",
  language: "javascript",
  unified: `--- a/src/services/userService.js
+++ b/src/services/userService.js
@@ -40,6 +40,10 @@
 async function getUser(email) {
   const user = await db.users.findOne({ email });
-  return { id: user.id, email: user.email };
+  if (!user) {
+    throw new NotFoundError(\`No account found for \${email}\`);
+  }
+  return { id: user.id, email: user.email };
 }
`,
};

const PYTHON_DIFF: SuggestedDiff = {
  filename: "app.py",
  language: "python",
  unified: `--- a/app.py
+++ b/app.py
@@ -85,7 +85,11 @@
 def process_payment(order):
-    amount = order["total"]
+    amount = order.get("total")
+    if amount is None:
+        raise ValueError(
+            "Order is missing a total. Check the checkout payload before charging."
+        )
     charge(amount)
`,
};

const ENV_DIFF: SuggestedDiff = {
  filename: "src/db.js",
  language: "javascript",
  unified: `--- a/src/db.js
+++ b/src/db.js
@@ -1,4 +1,9 @@
-const db = new Pool({ connectionString: process.env.DATABASE_URL });
+const databaseUrl = process.env.DATABASE_URL;
+if (!databaseUrl) {
+  throw new Error(
+    "DATABASE_URL is missing. Set it in the host environment before the app starts."
+  );
+}
+const db = new Pool({ connectionString: databaseUrl });
`,
};

function nodeUndefinedPayload(parsed: ParsedLog): AnalysisPayload {
  const file = parsed.frames[0]?.file ?? "the user lookup";
  const fn = parsed.frames[0]?.function ?? "getUser";
  return {
    classification: "Crash on missing customer record",
    severity: parsed.hints.includes("revenue-path") ? "outage" : "degraded",
    severityLabel: parsed.hints.includes("revenue-path")
      ? "Likely outage — checkout path"
      : "User-facing crash",
    rootCause: `The app assumed a customer record always exists, then tried to read an id from empty data. That usually means a guest checkout, a deleted account, or a lookup that returned nothing — and the code never checked. The failure showed up in ${fn} (${file}).`,
    impact:
      "Anyone hitting this path sees a hard error instead of a useful message. If it sits on checkout, sales stop until the guard is added.",
    suggestedFix:
      "Stop treating the database result as guaranteed. If no user is found, return a clear 'not found' response instead of crashing on .id.",
    diff: NODE_DIFF,
    checklist: [
      "Reproduce with an email that is not in the database.",
      "Confirm the API returns 404 (or a form error), not a 500.",
      "Check whether guests are allowed through this route.",
    ],
  };
}

function pythonKeyErrorPayload(parsed: ParsedLog): AnalysisPayload {
  const file = parsed.frames.at(-1)?.file ?? "app.py";
  return {
    classification: "Payment failed — missing order total",
    severity: "outage",
    severityLabel: "Likely outage — payment path",
    rootCause: `Python raised KeyError because the order object had no "total" field. The charge function expected a complete cart, but the payload arriving from checkout was incomplete — a renamed field, a failed price calculation, or a client that never sent the amount. It broke in ${file}.`,
    impact:
      "Payments throw instead of charging. Customers see a failure; you lose the sale and get a support ticket.",
    suggestedFix:
      "Read the total safely, refuse to charge if it is missing, and log the incoming payload so the next incomplete order is obvious.",
    diff: PYTHON_DIFF,
    checklist: [
      "Inspect a real failing request body — is `total` missing or named `amount`?",
      "Reject incomplete orders before they reach the payment provider.",
      "Add a test for a cart with no total.",
    ],
  };
}

function envConfigPayload(parsed: ParsedLog): AnalysisPayload {
  const envName = parsed.missingEnvVars[0] ?? "DATABASE_URL";
  return {
    classification: "App cannot reach its database",
    severity: "config",
    severityLabel: "Config issue — environment not set",
    rootCause: `The process tried to open a database connection and was refused. Most often this is not a code bug: ${envName} is missing, pointed at localhost in production, or the database was never started. The app booted anyway and failed on the first real request.`,
    impact:
      "Every feature that needs data is down. This is the classic 'it worked on my machine' outage after a deploy.",
    suggestedFix: `Fail fast at startup if ${envName} is missing, and set the real connection string in the host's environment (not in source control). Confirm the database is reachable from the app's network.`,
    diff: ENV_DIFF,
    checklist: [
      `Verify ${envName} is set in the hosting dashboard.`,
      "Confirm the database is running and accepts connections from the app.",
      "Restart the app after changing environment variables — most hosts do not hot-reload them.",
    ],
  };
}

function genericPayload(parsed: ParsedLog): AnalysisPayload {
  const where = parsed.frames[0]?.file
    ? ` It surfaced in ${parsed.frames[0].file}${
        parsed.frames[0].line ? `:${parsed.frames[0].line}` : ""
      }.`
    : "";

  return {
    classification:
      parsed.errorType === "Unknown"
        ? "Unclear failure — needs a cleaner snippet"
        : `${parsed.errorType} in production path`,
    severity: parsed.hints.includes("revenue-path") ? "outage" : "degraded",
    severityLabel: parsed.hints.includes("revenue-path")
      ? "Possible outage"
      : "Needs a developer look",
    rootCause:
      parsed.errorType === "Unknown"
        ? "This snippet does not contain a clear error line. The useful part of a crash log is the first error type (for example TypeError) plus the few lines of 'at ...' or 'File ...' under it."
        : `${parsed.errorType}: ${parsed.errorMessage}.${where} The surrounding frames show where the process was when it gave up — start there, not at the noise above it.`,
    impact:
      "Until this is classified, assume users on this path are stuck. A short, specific log is enough to brief a developer.",
    suggestedFix:
      parsed.errorType === "Unknown"
        ? "Paste the error line and 10–20 lines of stack below it. Avoid access logs and health-check noise."
        : `Inspect ${parsed.frames[0]?.file ?? "the top frame"} and handle the failed assumption behind "${parsed.errorMessage}".`,
    diff: null,
    checklist: [
      "Keep the error type, message, and stack — drop unrelated log spam.",
      "Note whether this happens for every user or a specific action.",
      "Check the last deploy time against when the errors started.",
    ],
  };
}

export function mockAnalysis(parsed: ParsedLog): AnalysisPayload {
  if (parsed.errorType === "KeyError" || parsed.hints.includes("missing-key")) {
    return pythonKeyErrorPayload(parsed);
  }

  if (
    parsed.errorType === "TypeError" ||
    parsed.hints.includes("null-dereference")
  ) {
    return nodeUndefinedPayload(parsed);
  }

  const looksLikeEnv =
    parsed.hints.includes("connection-refused") ||
    parsed.missingEnvVars.some((name) =>
      /URL|URI|HOST|DATABASE|REDIS|MONGO/i.test(name)
    );

  if (looksLikeEnv) {
    return envConfigPayload(parsed);
  }

  return genericPayload(parsed);
}

const SYSTEM_PROMPT = `You are a gate + incident responder for a crash-log analyzer.

Step 1 — decide if the input is a software incident log.
ACCEPT (accept=true) when the text is:
- a stack trace or traceback
- an exception line (TypeError:, KeyError:, Error:, FATAL:)
- a classic one-line runtime error, even with no stack — including "undefined is not a function", "x is not defined", "Cannot read properties of undefined"
- connection/env failures (ECONNREFUSED, missing DATABASE_URL)

REJECT (accept=false) when it is a question, trivia, chat, greeting, or anything that is not an application error.

A short error message with no stack is still a log. "undefined is not a function" MUST be accepted.

Return JSON only:
{
  "accept": true or false,
  "rejectMessage": string or null,
  "classification": "short name of what broke",
  "severity": "outage" | "degraded" | "config",
  "severityLabel": "human label",
  "rootCause": "2-4 sentences of plain English",
  "impact": "1-2 sentences on what the business feels",
  "suggestedFix": "what to change, in plain English",
  "diff": { "filename": "path", "language": "javascript" | "python" | "other", "unified": "unified diff" } | null,
  "checklist": ["3 concrete verification steps"]
}

If accept is false:
- rejectMessage: one short sentence. Tell them this demo only reads crash logs and to paste a stack trace or click Try example.
- Do NOT answer their question. Do NOT invent an outage.
- Put empty strings in the briefing fields, severity "degraded", diff null, checklist [].

If accept is true:
- rejectMessage must be null
- Write a briefing a non-technical founder can read in 30 seconds
- Prefer a small realistic diff when the failing file is obvious
- Never invent credentials, hosts, or customer data`;

function userPrompt(logText: string, parsed: ParsedLog): string {
  return `Parsed structure (deterministic, do not ignore):
${JSON.stringify(parsed, null, 2)}

Raw log:
\`\`\`
${logText.slice(0, 12000)}
\`\`\``;
}

function isPayload(value: unknown): value is AnalysisPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.classification === "string" &&
    v.classification.trim().length > 0 &&
    typeof v.rootCause === "string" &&
    typeof v.suggestedFix === "string" &&
    (v.severity === "outage" ||
      v.severity === "degraded" ||
      v.severity === "config")
  );
}

function isReject(value: unknown): value is { accept: false; rejectMessage?: string } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.accept === false;
}

function briefingFromJson(parsedJson: AnalysisPayload): AnalysisPayload {
  return {
    ...parsedJson,
    checklist: Array.isArray(parsedJson.checklist)
      ? parsedJson.checklist.map(String).slice(0, 6)
      : [],
    diff:
      parsedJson.diff && typeof parsedJson.diff === "object"
        ? parsedJson.diff
        : null,
  };
}

export type LlmResult =
  | { kind: "reject"; message: string; source: "llm" }
  | {
      kind: "briefing";
      payload: AnalysisPayload;
      source: "llm" | "mock" | "fallback";
      error?: string;
    };

const DEFAULT_REJECT =
  "That's not a crash log. This demo only reads error dumps — paste a stack trace, or click Try example.";

function friendlyLlmError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { code?: string; type?: string; message?: string };
    };
    const code = parsed.error?.code ?? parsed.error?.type ?? "";
    if (code === "insufficient_quota" || status === 429) {
      return "OpenAI received the key, but this account is out of quota. Add billing at platform.openai.com, then analyze again.";
    }
    if (status === 401 || code === "invalid_api_key") {
      return "OpenAI rejected the key. Check OPENAI_API_KEY in server/.env and restart the API.";
    }
    if (parsed.error?.message) {
      return `OpenAI error (${status}): ${parsed.error.message}`;
    }
  } catch {
    // fall through
  }
  return `OpenAI request failed (${status}).`;
}

/**
 * TODO: Plug in your LLM provider.
 *
 * Set OPENAI_API_KEY (and optionally OPENAI_MODEL) to enable live calls.
 * Without a key, the server returns a high-quality mock so the demo still runs.
 *
 * Swap the fetch URL / headers here if you use Anthropic, Groq, OpenRouter, etc.
 */
export async function analyzeWithLlm(
  logText: string,
  parsed: ParsedLog
): Promise<LlmResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return { kind: "briefing", payload: mockAnalysis(parsed), source: "mock" };
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const endpoint =
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1/chat/completions";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt(logText, parsed) },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("LLM HTTP error", response.status, detail.slice(0, 500));
      return {
        kind: "briefing",
        payload: mockAnalysis(parsed),
        source: "fallback",
        error: friendlyLlmError(response.status, detail),
      };
    }

    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      return {
        kind: "briefing",
        payload: mockAnalysis(parsed),
        source: "fallback",
        error: "OpenAI returned an empty reply.",
      };
    }

    const parsedJson: unknown = JSON.parse(content);
    const stillALog =
      parsed.errorType !== "Unknown" ||
      parsed.frames.length > 0 ||
      hasClassicRuntimeError(logText);

    if (isReject(parsedJson) && !stillALog) {
      const message =
        typeof parsedJson.rejectMessage === "string" &&
        parsedJson.rejectMessage.trim().length > 0
          ? parsedJson.rejectMessage.trim().slice(0, 280)
          : DEFAULT_REJECT;
      return { kind: "reject", message, source: "llm" };
    }

    const accepted =
      parsedJson &&
      typeof parsedJson === "object" &&
      (parsedJson as { accept?: unknown }).accept === true;

    if (!accepted && !stillALog) {
      return { kind: "reject", message: DEFAULT_REJECT, source: "llm" };
    }

    if (!isPayload(parsedJson)) {
      if (stillALog) {
        return {
          kind: "briefing",
          payload: mockAnalysis(parsed),
          source: "fallback",
          error: "The model refused a one-line error, so a local briefing was used.",
        };
      }
      return {
        kind: "briefing",
        payload: mockAnalysis(parsed),
        source: "fallback",
        error: "OpenAI returned JSON that did not match the briefing schema.",
      };
    }

    return {
      kind: "briefing",
      payload: briefingFromJson(parsedJson),
      source: "llm",
    };
  } catch (error) {
    console.error("LLM call failed, using mock", error);
    return {
      kind: "briefing",
      payload: mockAnalysis(parsed),
      source: "fallback",
      error:
        error instanceof Error
          ? `Could not reach OpenAI: ${error.message}`
          : "Could not reach OpenAI.",
    };
  }
}
