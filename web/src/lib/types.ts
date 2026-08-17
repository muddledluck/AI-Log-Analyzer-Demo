export type Severity = "outage" | "degraded" | "config";

export interface StackFrame {
  file?: string;
  line?: number;
  column?: number;
  function?: string;
  raw: string;
}

export interface ParsedLog {
  runtime: "node" | "python" | "generic";
  errorType: string;
  errorMessage: string;
  frames: StackFrame[];
  missingEnvVars: string[];
  hints: string[];
  fingerprint: string;
}

export interface SuggestedDiff {
  filename: string;
  language: string;
  unified: string;
}

export interface AnalyzeResponse {
  classification: string;
  severity: Severity;
  severityLabel: string;
  rootCause: string;
  impact: string;
  suggestedFix: string;
  diff: SuggestedDiff | null;
  checklist: string[];
  cached: boolean;
  source: "llm" | "mock" | "fallback";
  parsed: ParsedLog;
  llmError?: string;
}

export interface AnalyzeError {
  error: string;
}
