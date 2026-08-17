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
  { afterMs: 800, label: "Isolating the crash" },
  { afterMs: 1800, label: "Drafting the briefing" },
  { afterMs: 3200, label: "Waiting on the model" },
] as const;

function progressWidth(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  return Math.min(92, 12 + 80 * (1 - Math.exp(-seconds / 2.4)));
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

  return (
    <div aria-live="polite" aria-busy="true">
      <p className="text-sm text-muted-foreground">{STEPS[activeIndex].label}…</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-150 ease-out"
          style={{ width: `${progressWidth(elapsed)}%` }}
        />
      </div>
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
      setError("Paste a log, upload a file, or try an example.");
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Try an example:{" "}
        {EXAMPLES.map((example, index) => (
          <span key={example.id}>
            {index > 0 ? <span className="text-border"> · </span> : null}
            <button
              type="button"
              onClick={() => loadExample(example.id)}
              className={cn(
                "underline-offset-4 hover:underline",
                activeExample === example.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {example.title}
            </button>
          </span>
        ))}
      </p>

      <Textarea
        value={logText}
        onChange={(event) => {
          setLogText(event.target.value);
          setActiveExample(null);
        }}
        placeholder="Paste a crash log — TypeError, traceback, or the at file.js:12 lines."
        className="min-h-[200px] resize-y font-mono text-[13px] leading-5 md:text-[13px]"
        disabled={loading}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".log,.txt,.out,.err,text/plain"
        className="hidden"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          className="h-9 justify-start px-3"
          disabled={loading}
        >
          <UploadIcon />
          Upload a file
        </Button>
        <Button
          onClick={() => void onAnalyze()}
          disabled={loading}
          className="h-9 px-4"
        >
          {loading ? <LoaderCircleIcon className="animate-spin" /> : null}
          {loading ? "Working…" : "Find the error and the fix"}
        </Button>
      </div>

      {loading && startedAt ? <AnalysisProgress startedAt={startedAt} /> : null}

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-4">
          <AnalysisResult result={result} />
        </div>
      ) : null}
    </div>
  );
}
