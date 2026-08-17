"use client";

import { DiffView } from "@/components/diff-view";
import type { AnalyzeResponse, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityStyles: Record<Severity, string> = {
  outage:
    "text-red-700 dark:text-red-300",
  degraded:
    "text-amber-700 dark:text-amber-300",
  config:
    "text-sky-700 dark:text-sky-300",
};

const sections = [
  { title: "What broke" },
  { title: "Why it happened" },
  { title: "The fix" },
] as const;

interface AnalysisResultProps {
  result: AnalyzeResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const bodies = [result.impact, result.rootCause, result.suggestedFix];

  return (
    <article className="space-y-6 rounded-xl border bg-card p-5 shadow-xs sm:p-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Briefing
          </p>
          <p className={cn("text-sm", severityStyles[result.severity])}>
            {result.severityLabel}
          </p>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-balance">
          {result.classification}
        </h2>
        {result.parsed.errorType !== "Unknown" ? (
          <p className="font-mono text-xs leading-5 text-muted-foreground">
            {result.parsed.errorType}: {result.parsed.errorMessage}
          </p>
        ) : null}
        {result.source === "mock" ? (
          <p className="text-xs text-muted-foreground">
            Demo briefing — no API key set.
          </p>
        ) : null}
        {result.source === "fallback" ? (
          <p className="text-xs text-muted-foreground">
            {result.llmError ?? "Live call failed; showing a local briefing."}
          </p>
        ) : null}
      </header>

      <ol className="space-y-5">
        {sections.map((section, index) => (
          <li key={section.title}>
            <p className="text-sm font-medium">{section.title}</p>
            <p className="mt-1 text-[15px] leading-7 text-muted-foreground text-pretty">
              {bodies[index]}
            </p>
          </li>
        ))}
      </ol>

      {result.diff ? (
        <DiffView filename={result.diff.filename} unified={result.diff.unified} />
      ) : null}

      {result.checklist.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Before you ship</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
            {result.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
