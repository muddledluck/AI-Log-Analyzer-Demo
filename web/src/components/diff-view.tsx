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
  if (line.startsWith("@@")) return "text-foreground/70";
  if (line.startsWith("+")) {
    return "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (line.startsWith("-")) {
    return "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300";
  }
  return "text-muted-foreground";
}

export function DiffView({ filename, unified }: DiffViewProps) {
  const lines = unified.replace(/\n$/, "").split("\n");

  return (
    <div className="overflow-hidden rounded-md border">
      <p className="border-b bg-muted/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">
        {filename}
      </p>
      <pre className="overflow-x-auto text-[12px] leading-6">
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
