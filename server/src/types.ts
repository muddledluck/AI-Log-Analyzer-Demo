export type Runtime = "node" | "python" | "generic";
export type Severity = "outage" | "degraded" | "config";
export type AnalysisSource = "llm" | "mock" | "fallback";

export interface StackFrame {
  file?: string;
  line?: number;
  column?: number;
  function?: string;
  raw: string;
}

export interface ParsedLog {
  runtime: Runtime;
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

export interface AnalysisPayload {
  classification: string;
  severity: Severity;
  severityLabel: string;
  rootCause: string;
  impact: string;
  suggestedFix: string;
  diff: SuggestedDiff | null;
  checklist: string[];
}

export interface AnalyzeResponse extends AnalysisPayload {
  cached: boolean;
  source: AnalysisSource;
  parsed: ParsedLog;
  llmError?: string;
}
