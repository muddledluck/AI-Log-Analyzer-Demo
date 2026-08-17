const STEPS = [
  {
    n: "01",
    title: "You drop in the crash",
    body: "Paste the red text from your app, or click a sample incident. The model first checks that it is a crash log — questions are refused, not answered.",
  },
  {
    n: "02",
    title: "The failure is isolated",
    body: "The noisy lines around a crash get ignored. What remains is the actual break: which action failed, and what the software assumed that turned out to be false.",
  },
  {
    n: "03",
    title: "You leave with a briefing and a patch",
    body: "In plain English: what broke, what customers feel, and a suggested code change. Send it to a developer, or apply it yourself if you ship your own product.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-8 py-20">
      <p className="font-mono text-[11px] tracking-[0.2em] text-primary/80 uppercase">
        How it works
      </p>
      <h2 className="font-heading mt-3 max-w-xl text-3xl leading-tight text-balance sm:text-4xl">
        From panic to a written brief — without waiting on a ticket.
      </h2>
      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.n} className="relative">
            <p className="font-mono text-[11px] text-primary/70">{step.n}</p>
            <h3 className="mt-3 font-heading text-xl">{step.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground text-pretty">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
