const STEPS = [
  {
    title: "Paste the crash",
    body: "Drop in the red text from your app, or try an example. Questions are refused.",
  },
  {
    title: "See what actually broke",
    body: "The noisy lines around a crash are ignored. You get the failure, in plain English.",
  },
  {
    title: "Leave with a fix",
    body: "A short briefing and a suggested code change you can send to a developer.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-8">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        About this demo
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">How it works</h2>
      <ol className="mt-6 space-y-5">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <p className="text-sm font-medium">
              {index + 1}. {step.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
