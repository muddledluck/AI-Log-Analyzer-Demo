"use client";

import { useEffect, useRef, useState } from "react";
import { AnalysisResult } from "@/components/analysis-result";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeLog } from "@/lib/api";
import { EXAMPLES, type ExampleId } from "@/lib/examples";
import type { AnalyzeResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LoaderCircleIcon, UploadIcon } from "lucide-react";

const STEPS = [
  { afterMs: 0, label: "Checking this is a crash log" },
  { afterMs: 700, label: "Isolating the crash" },
  { afterMs: 1600, label: "Tracing the cause" },
  { afterMs: 2600, label: "Drafting the briefing" },
  { afterMs: 4000, label: "Waiting on the model" },
] as const;

function progressWidth(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  return Math.min(92, 12 + (80 * (1 - Math.exp(-seconds / 2.4))));
}

function formatElapsed(elapsedMs: number): string {
  const seconds = elapsedMs / 1000;
  return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds)}s`;
}

function AnalysisProgress({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 80);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = Math.max(0, now - startedAt);
  const activeIndex = STEPS.reduce(
    (current, step, index) => (elapsed >= step.afterMs ? index : current),
    0
  );
  const current = STEPS[activeIndex];

  return (
    <div
      className="rounded-lg bg-foreground/3 px-4 py-3 ring-1 ring-foreground/8"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{current.label}…</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {formatElapsed(elapsed)}
        </p>
      </div>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progressWidth(elapsed)}%` }}
        />
      </div>
      <ol className="mt-3 space-y-1.5">
        {STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-2 font-mono text-[11px] tracking-wide",
                done && "text-muted-foreground",
                active && "text-primary",
                !done && !active && "text-muted-foreground/40"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  done && "bg-primary/70",
                  active && "bg-primary shadow-[0_0_8px_var(--color-primary)]",
                  !done && !active && "bg-foreground/20"
                )}
              />
              {step.label}
              {done ? " — done" : active ? " — in progress" : ""}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AnalyzerWorkspace() {
  const [logText, setLogText] = useState("");
  const [activeExample, setActiveExample] = useState<ExampleId | null>(null);
  const [loading, setLoading] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function loadExample(id: ExampleId) {
    const example = EXAMPLES.find((item) => item.id === id);
    if (!example) return;
    setActiveExample(id);
    setLogText(example.log.trim());
    setError(null);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setActiveExample(null);
    setLogText(text);
    setError(null);
  }

  async function onAnalyze() {
    if (!logText.trim()) {
      setError("Paste a log, upload a file, or try one of the sample incidents.");
      return;
    }

    setLoading(true);
    setStartedAt(Date.now());
    setError(null);
    setResult(null);

    try {
      const next = await analyzeLog(logText);
      setResult(next);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not reach the analyzer. Is the API running on port 4000?"
      );
    } finally {
      setLoading(false);
      setStartedAt(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-primary/90 uppercase">
            Live demo
          </p>
          <h2 className="font-heading mt-1 text-xl">Drop in an incident</h2>
        </div>
        <p className="hidden max-w-[11rem] text-right text-[11px] leading-4 text-muted-foreground sm:block">
          No account. Nothing is stored beyond a short cache.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {EXAMPLES.map((example) => {
          const selected = activeExample === example.id;
          return (
            <button
              key={example.id}
              type="button"
              onClick={() => loadExample(example.id)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-left ring-1 transition-colors",
                selected
                  ? "bg-primary/12 ring-primary/40"
                  : "bg-foreground/3 ring-foreground/10 hover:bg-foreground/6"
              )}
            >
              <p className="text-[11px] font-medium tracking-wide text-primary/80 uppercase">
                Try example · {example.runtime}
              </p>
              <p className="mt-1 text-sm font-medium">{example.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {example.stakes}
              </p>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Textarea
          value={logText}
          onChange={(event) => {
            setLogText(event.target.value);
            setActiveExample(null);
          }}
          placeholder="Paste a crash log — a TypeError, traceback, or the 'at file.js:12' lines. Not a question."
          className="min-h-[220px] resize-y bg-background/50 font-mono text-[12px] leading-5 md:text-[12px]"
          disabled={loading}
        />
        <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
          The model first checks that this is a crash log. Questions and chat
          are refused — they are not answered.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".log,.txt,.out,.err,text/plain"
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          className="h-10 justify-start px-3"
          disabled={loading}
        >
          <UploadIcon />
          Upload a .log or .txt file
        </Button>
        <Button
          onClick={() => void onAnalyze()}
          disabled={loading}
          className="h-11 min-w-[13.5rem] px-6 text-sm"
        >
          {loading ? <LoaderCircleIcon className="animate-spin" /> : null}
          {loading ? "Working…" : "Find the error and the fix"}
        </Button>
      </div>

      {loading && startedAt ? <AnalysisProgress startedAt={startedAt} /> : null}

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="border-t border-foreground/10 pt-6">
          <AnalysisResult result={result} />
        </div>
      ) : null}
    </div>
  );
}
