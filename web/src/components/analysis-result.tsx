"use client";

import { Badge } from "@/components/ui/badge";
import { DiffView } from "@/components/diff-view";
import type { AnalyzeResponse, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityStyles: Record<Severity, string> = {
  outage: "bg-red-500/15 text-red-300 ring-red-500/20",
  degraded: "bg-amber-500/15 text-amber-200 ring-amber-500/20",
  config: "bg-sky-500/15 text-sky-200 ring-sky-500/20",
};

const sections = [
  { n: "01", title: "What broke" },
  { n: "02", title: "Why it happened" },
  { n: "03", title: "The fix" },
] as const;

interface AnalysisResultProps {
  result: AnalyzeResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const bodies = [result.impact, result.rootCause, result.suggestedFix];

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-foreground/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ring-1",
                severityStyles[result.severity]
              )}
            >
              {result.severityLabel}
            </span>
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              {result.parsed.runtime}
            </Badge>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {result.source === "llm"
                ? "Live model"
                : result.source === "fallback"
                  ? "Demo briefing · live call failed"
                  : "Demo briefing · no API key"}
            </Badge>
            {result.cached ? (
              <Badge variant="outline" className="text-[10px] uppercase">
                Served from cache
              </Badge>
            ) : null}
          </div>
          <h3 className="font-heading text-2xl leading-tight text-balance">
            {result.classification}
          </h3>
          {result.source === "mock" ? (
            <p className="text-xs leading-5 text-muted-foreground">
              No OpenAI key is set, so this is a pattern-matched demo briefing —
              the same shape a live model would return. Add{" "}
              <code className="font-mono text-[11px]">OPENAI_API_KEY</code> in{" "}
              <code className="font-mono text-[11px]">server/.env</code> and
              restart the API to switch to a real call.
            </p>
          ) : null}
          {result.source === "fallback" ? (
            <p className="text-xs leading-5 text-muted-foreground">
              {result.llmError ??
                "The live model call failed, so this page is showing the demo briefing instead."}
            </p>
          ) : null}
        </div>
        {result.parsed.errorType !== "Unknown" ? (
          <p className="max-w-xs font-mono text-[11px] leading-5 text-muted-foreground sm:text-right">
            {result.parsed.errorType}: {result.parsed.errorMessage}
          </p>
        ) : null}
      </header>

      <ol className="space-y-5">
        {sections.map((section, index) => (
          <li key={section.n} className="grid grid-cols-[auto_1fr] gap-x-4">
            <span className="font-mono text-[11px] text-primary/80">
              {section.n}
            </span>
            <div>
              <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                {section.title}
              </p>
              <p className="mt-1.5 text-[15px] leading-7 text-pretty">
                {bodies[index]}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {result.diff ? (
        <DiffView filename={result.diff.filename} unified={result.diff.unified} />
      ) : null}

      {result.checklist.length > 0 ? (
        <div className="rounded-lg bg-foreground/3 px-4 py-3 ring-1 ring-foreground/8">
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Before you ship
          </p>
          <ul className="mt-2 space-y-1.5">
            {result.checklist.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm leading-6 text-muted-foreground"
              >
                <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
