"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const NOTES = [
  {
    value: "flow",
    title: "Request path",
    body: "The Next.js app is static UI. Analyze POSTs to a standalone Express service. The API never writes logs to disk; the only persistence is a hash-keyed cache with a one-hour TTL.",
  },
  {
    value: "parser",
    title: "Parse, then the model decides",
    body: "A regex parser extracts runtime, error type, and stack frames. With an API key, the model decides accept vs reject in the same JSON call: questions get a refusal, crash dumps get a briefing. Without a key, a strict allowlist stands in.",
  },
  {
    value: "llm",
    title: "LLM is optional",
    body: "If OPENAI_API_KEY is unset, pattern-matched mock briefings still run. With a key, the same JSON schema is requested via Chat Completions. Failed live calls fall back to mock so the demo never goes blank.",
  },
  {
    value: "cache",
    title: "Redis, or memory",
    body: "SHA-256 of the trimmed log is the cache key. Upstash if configured; otherwise a process-local Map.",
  },
];

export function UnderTheHood() {
  return (
    <section id="under-the-hood" className="scroll-mt-8">
      <h2 className="text-lg font-semibold tracking-tight">Under the hood</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Next.js + Express. Redis only for cache. No accounts.
      </p>
      <Accordion className="mt-4">
        {NOTES.map((note) => (
          <AccordionItem key={note.value} value={note.value}>
            <AccordionTrigger className="text-sm hover:no-underline">
              {note.title}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-6">
              {note.body}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
