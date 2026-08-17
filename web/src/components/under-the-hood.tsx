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
    title: "Deterministic parse before the model",
    body: "A regex parser extracts runtime, error type, and stack frames. With an API key, the model then decides accept vs reject in the same JSON call: questions get a refusal, crash dumps get a briefing. Without a key, a strict allowlist stands in so the demo still refuses chat.",
  },
  {
    value: "llm",
    title: "LLM is optional — mock is first-class",
    body: "If OPENAI_API_KEY is unset, pattern-matched mock briefings still produce classification, impact, root cause, a unified diff, and a ship checklist. With a key, the same JSON schema is requested via Chat Completions (model overridable). Failed live calls fall back to mock so the demo never goes blank.",
  },
  {
    value: "cache",
    title: "Redis (Upstash) with an in-memory fallback",
    body: "SHA-256 of the trimmed log is the cache key. When UPSTASH_REDIS_REST_URL and TOKEN are set, results live in Upstash. Otherwise a process-local Map is used so local demos do not need Redis.",
  },
  {
    value: "scope",
    title: "What this demo is not",
    body: "No auth, no log storage, no ticket integration, no auto-commit. The product slice is: ingest → classify → explain → suggest a patch. That is the flow a client can click through in one sitting.",
  },
];

export function UnderTheHood() {
  return (
    <section id="under-the-hood" className="scroll-mt-8 pb-24">
      <div className="rounded-2xl bg-foreground/3 px-5 py-6 ring-1 ring-foreground/8 sm:px-8 sm:py-8">
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          For technical clients
        </p>
        <h2 className="font-heading mt-2 text-2xl">Under the hood</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Next.js App Router + TypeScript on the frontend. Express on a separate
          Node process. shadcn/ui and Tailwind for the interface. Redis only for
          analysis cache.
        </p>
        <Accordion className="mt-6">
          {NOTES.map((note) => (
            <AccordionItem key={note.value} value={note.value}>
              <AccordionTrigger className="text-[15px] hover:no-underline">
                {note.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-6">
                {note.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
