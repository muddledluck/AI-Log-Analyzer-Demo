export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <a href="#top" className="flex items-baseline gap-2">
        <span className="font-heading text-lg tracking-tight">Sentinel</span>
        <span className="hidden text-[11px] tracking-[0.14em] text-muted-foreground uppercase sm:inline">
          Error briefing
        </span>
      </a>
      <nav className="flex items-center gap-5 text-sm text-muted-foreground">
        <a href="#how-it-works" className="hover:text-foreground">
          How it works
        </a>
        <a href="#under-the-hood" className="hover:text-foreground">
          Under the hood
        </a>
        <span className="hidden items-center gap-1.5 font-mono text-[10px] tracking-wider text-primary/80 uppercase sm:flex">
          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_var(--color-emerald-400)]" />
          Demo live
        </span>
      </nav>
    </header>
  );
}
