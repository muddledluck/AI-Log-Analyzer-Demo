"use client";

import { cn } from "@/lib/utils";

interface DiffViewProps {
  filename: string;
  unified: string;
}

function lineTone(line: string): string {
  if (line.startsWith("+++") || line.startsWith("---")) {
    return "text-muted-foreground";
  }
  if (line.startsWith("@@")) return "text-primary/80";
  if (line.startsWith("+")) return "bg-emerald-500/10 text-emerald-300";
  if (line.startsWith("-")) return "bg-red-500/10 text-red-300";
  return "text-muted-foreground";
}

export function DiffView({ filename, unified }: DiffViewProps) {
  const lines = unified.replace(/\n$/, "").split("\n");

  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/4 px-3 py-2">
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
          Suggested change · {filename}
        </p>
      </div>
      <pre className="overflow-x-auto bg-background/40 p-0 text-[12px] leading-6">
        {lines.map((line, index) => (
          <span
            key={`${index}-${line.slice(0, 24)}`}
            className={cn("block whitespace-pre px-3", lineTone(line))}
          >
            {line.length === 0 ? " " : line}
          </span>
        ))}
      </pre>
    </div>
  );
}
