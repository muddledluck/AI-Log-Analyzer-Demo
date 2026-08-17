import { AnalyzerWorkspace } from "@/components/analyzer-workspace";
import { HowItWorks } from "@/components/how-it-works";
import { SiteHeader } from "@/components/site-header";
import { UnderTheHood } from "@/components/under-the-hood";

export default function Home() {
  return (
    <div id="top" className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
        <SiteHeader />

        <section className="grid items-start gap-12 py-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-14">
          <div className="lg:sticky lg:top-10">
            <p className="font-mono text-[11px] tracking-[0.22em] text-primary/85 uppercase">
              For founders who cannot afford a 3am outage
            </p>
            <h1 className="font-heading mt-4 text-[2.15rem] leading-[1.12] tracking-tight text-balance sm:text-5xl">
              I automate finding and fixing errors before they cause downtime.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-8 text-muted-foreground text-pretty">
              Paste a crash log. In under a minute you get a briefing: what
              broke, why customers feel it, and the change to ship — without
              waiting on someone to decode a stack trace.
            </p>
            <dl className="mt-10 grid gap-6 border-t border-foreground/10 pt-8 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-[11px] tracking-wider text-primary/80 uppercase">
                  Minutes
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                  Not a war-room. A written brief you can act on.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] tracking-wider text-primary/80 uppercase">
                  Plain English
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                  Built for operators first, engineers second.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] tracking-wider text-primary/80 uppercase">
                  Patch-ready
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                  A suggested diff, not a generic “check your config.”
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-card/80 p-4 shadow-[0_24px_80px_-32px_oklch(0.1_0.03_50)] ring-1 ring-foreground/10 sm:p-6">
            <AnalyzerWorkspace />
          </div>
        </section>

        <HowItWorks />
        <UnderTheHood />

        <footer className="mt-auto flex flex-col gap-2 border-t border-foreground/10 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Sentinel · AI Log Analyzer & Auto-Fixer · portfolio demo</p>
          <p>No accounts. Logs are not kept past the cache window.</p>
        </footer>
      </div>
    </div>
  );
}
