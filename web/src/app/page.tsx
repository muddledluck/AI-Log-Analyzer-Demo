import { AnalyzerWorkspace } from "@/components/analyzer-workspace";
import { HowItWorks } from "@/components/how-it-works";
import { SiteHeader } from "@/components/site-header";
import { UnderTheHood } from "@/components/under-the-hood";

export default function Home() {
  return (
    <div id="top" className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
        <SiteHeader />

        <div className="grid flex-1 gap-10 pb-4 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start lg:gap-14">
          <div className="contents lg:sticky lg:top-6 lg:block lg:self-start">
            <section className="order-1 pt-6 pb-2 sm:pt-8 lg:pb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                I automate finding and fixing errors before they cause downtime.
              </h1>
              <p className="mt-3 max-w-lg text-[15px] leading-7 text-muted-foreground text-pretty">
                Paste a crash log. Get what broke, why it matters, and a
                suggested fix.
              </p>
            </section>

            <div className="order-3 space-y-10 border-t pt-8 lg:border-t-0 lg:pt-0">
              <HowItWorks />
              <UnderTheHood />
            </div>
          </div>

          <div className="order-2 min-w-0 lg:pt-8">
            <AnalyzerWorkspace />
          </div>
        </div>

        <footer className="mt-auto flex flex-col gap-1 border-t py-8 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>Sentinel · portfolio demo</p>
          <p>No accounts. Logs are not stored past the cache window.</p>
        </footer>
      </div>
    </div>
  );
}
