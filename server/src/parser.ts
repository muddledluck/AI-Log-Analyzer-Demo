import type { ParsedLog, Runtime, StackFrame } from "./types.js";

const NODE_ERROR =
  /^(?<type>(?:[A-Za-z][\w.]*)?(?:Error|Exception|ERR_[A-Z0-9_]+)):\s*(?<msg>.+)$/m;
const PYTHON_ERROR =
  /^(?<type>[A-Za-z_][\w.]*(?:Error|Exception|Warning)):\s*(?<msg>.*)$/m;
const NODE_FRAME =
  /at (?:(?<fn>\S+) )?\(?(?<file>(?:[A-Za-z]:)?[^():\n]+):(?<line>\d+):(?<col>\d+)\)?/g;
const PYTHON_FRAME =
  /^\s*File "(?<file>[^"]+)", line (?<line>\d+)(?:, in (?<fn>\S+))?/gm;
const CLASSIC_RUNTIME =
  /undefined is not (?:a function|an object)|null is not an object|\bis not a function\b|\bis not defined\b|Cannot read propert(?:y|ies) of (?:undefined|null)|Unexpected token|Maximum call stack size exceeded|Uncaught \w+(?:Error|Exception)/i;
const ENV_NAME = /\b([A-Z][A-Z0-9_]{2,})\b/g;

export function hasClassicRuntimeError(log: string): boolean {
  return CLASSIC_RUNTIME.test(log);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function detectRuntime(log: string): Runtime {
  if (
    /Traceback \(most recent call last\)/i.test(log) ||
    /File "[^"]+", line \d+/.test(log)
  ) {
    return "python";
  }
  if (
    /(?:^|\n)(?:node:|at \S+ \(|Cannot read propert(?:y|ies) of)/i.test(log) ||
    /(?:TypeError|ReferenceError|SyntaxError|ECONNREFUSED|UnhandledPromiseRejection)/.test(
      log
    )
  ) {
    return "node";
  }
  return "generic";
}

function extractEnvVars(log: string): string[] {
  const names = new Set<string>();
  const explicit =
    /(?:process\.env\.|os\.environ(?:\.get)?\(?['"]?)([A-Z][A-Z0-9_]{2,})/g;
  for (const match of log.matchAll(explicit)) {
    names.add(match[1]);
  }

  const missingLine =
    /\b([A-Z][A-Z0-9_]{2,})\b.{0,40}\b(?:undefined|not (?:set|defined)|missing|is required)\b/gi;
  for (const match of log.matchAll(missingLine)) {
    names.add(match[1].toUpperCase());
  }

  if (/ECONNREFUSED|database|postgres|mongodb|redis/i.test(log)) {
    for (const match of log.matchAll(ENV_NAME)) {
      if (/URL|URI|HOST|DSN|SECRET|KEY|TOKEN|DATABASE|REDIS|MONGO/.test(match[1])) {
        names.add(match[1]);
      }
    }
  }

  return [...names].slice(0, 6);
}

function extractHints(log: string): string[] {
  const hints: string[] = [];
  if (/ECONNREFUSED/.test(log)) hints.push("connection-refused");
  if (/ENOTFOUND/.test(log)) hints.push("dns-not-found");
  if (/UnhandledPromiseRejection|unhandledRejection/.test(log)) {
    hints.push("unhandled-rejection");
  }
  if (/Cannot read propert(?:y|ies) of undefined/.test(log)) {
    hints.push("null-dereference");
  }
  if (hasClassicRuntimeError(log)) hints.push("classic-runtime");
  if (/KeyError/.test(log)) hints.push("missing-key");
  if (/ModuleNotFoundError|Cannot find module/.test(log)) {
    hints.push("missing-module");
  }
  if (/\b(checkout|payment|order|invoice)\b/i.test(log)) {
    hints.push("revenue-path");
  }
  return unique(hints);
}

function firstError(
  log: string,
  runtime: Runtime
): { type: string; message: string } {
  const pattern = runtime === "python" ? PYTHON_ERROR : NODE_ERROR;
  const matches = [...log.matchAll(new RegExp(pattern.source, "gm"))];
  const last = matches.at(-1) ?? matches[0];
  if (last?.groups) {
    return { type: last.groups.type, message: last.groups.msg.trim() };
  }

  const fatal = log.match(/^(?:FATAL|ERROR|Error):\s*(.+)$/m);
  if (fatal) return { type: "Error", message: fatal[1].trim() };

  if (CLASSIC_RUNTIME.test(log)) {
    const line =
      log.split("\n").find((entry) => CLASSIC_RUNTIME.test(entry))?.trim() ??
      log.slice(0, 180);
    return { type: "TypeError", message: line };
  }

  return { type: "Unknown", message: "No clear error line found in this snippet." };
}

function nodeFrames(log: string): StackFrame[] {
  const frames: StackFrame[] = [];
  for (const match of log.matchAll(NODE_FRAME)) {
    const file = match.groups?.file;
    if (!file || file.startsWith("node:")) continue;
    frames.push({
      file,
      line: Number(match.groups?.line),
      column: Number(match.groups?.column ?? match.groups?.col),
      function: match.groups?.fn,
      raw: match[0],
    });
  }
  return frames.slice(0, 8);
}

function pythonFrames(log: string): StackFrame[] {
  const frames: StackFrame[] = [];
  for (const match of log.matchAll(PYTHON_FRAME)) {
    frames.push({
      file: match.groups?.file,
      line: Number(match.groups?.line),
      function: match.groups?.fn,
      raw: match[0].trim(),
    });
  }
  return frames.slice(-8);
}

export function parseLog(raw: string): ParsedLog {
  const log = raw.replace(/\r\n/g, "\n").trim();
  const runtime = detectRuntime(log);
  const error = firstError(log, runtime);
  const frames = runtime === "python" ? pythonFrames(log) : nodeFrames(log);
  const missingEnvVars = extractEnvVars(log);
  const hints = extractHints(log);
  const top = frames[0];
  const fingerprint = [
    runtime,
    error.type,
    error.message.slice(0, 80),
    top?.file ?? "",
    top?.function ?? "",
    hints.join(","),
  ]
    .join("|")
    .toLowerCase();

  return {
    runtime,
    errorType: error.type,
    errorMessage: error.message,
    frames,
    missingEnvVars,
    hints,
    fingerprint,
  };
}

export type LogGateResult =
  | { ok: true }
  | { ok: false; reason: "question" | "not-a-log" };

/**
 * Demo allowlist: only classic crash-dump shapes get through.
 * Words like "checkout" or a stray "ERROR" in a paragraph are not enough.
 */
export function gateIncidentLog(log: string, parsed: ParsedLog): LogGateResult {
  const hasStack =
    parsed.frames.length > 0 ||
    /Traceback \(most recent call last\)/i.test(log);
  const hasErrorLine = parsed.errorType !== "Unknown";

  if (looksLikeQuestionOrChat(log) && !hasStack && !hasErrorLine) {
    return { ok: false, reason: "question" };
  }

  if (hasStack || hasErrorLine) return { ok: true };

  if (hasClassicRuntimeError(log)) return { ok: true };

  if (
    /\b(ECONNREFUSED|ENOTFOUND|EACCES|ENOENT)\b/.test(log) ||
    /Cannot read propert(?:y|ies) of undefined/.test(log) ||
    /Cannot find module|ModuleNotFoundError/.test(log) ||
    /UnhandledPromiseRejection/.test(log) ||
    /\bpanic:/.test(log)
  ) {
    return { ok: true };
  }

  if (
    parsed.missingEnvVars.length > 0 &&
    /\b(undefined|not (?:set|defined)|missing|is required)\b/i.test(log)
  ) {
    return { ok: true };
  }

  return { ok: false, reason: "not-a-log" };
}

export const LOG_GATE_MESSAGE: Record<
  Exclude<LogGateResult, { ok: true }>["reason"],
  string
> = {
  question:
    "That's a question, not a crash log. This demo only reads error dumps — paste a stack trace, or click Try example.",
  "not-a-log":
    "No stack trace or error line found. Paste the red text from your app (for example TypeError: … plus the 'at …' lines), or click Try example.",
};

function looksLikeQuestionOrChat(log: string): boolean {
  const lines = log
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return true;

  const first = lines[0];
  const short = lines.length <= 4 && first.length < 280;

  if (short && /[?؟]\s*$/.test(first)) return true;
  if (
    short &&
    /^(please\s+)?(where|what|who|why|how|when|which|is|are|can|could|would|will|do|does|did|tell me|explain|write|make|give me|help me)\b/i.test(
      first
    )
  ) {
    return true;
  }
  if (
    lines.length <= 2 &&
    /^(hi|hello|hey|yo|thanks|thank you|ok|okay)\b/i.test(first)
  ) {
    return true;
  }
  return false;
}
