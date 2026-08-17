import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <a href="#top" className="text-[15px] font-medium tracking-tight">
        Sentinel
      </a>
      <nav className="flex items-center gap-1 text-sm text-muted-foreground sm:gap-3">
        <a href="#how-it-works" className="rounded-md px-2 py-1 hover:text-foreground">
          How it works
        </a>
        <a
          href="#under-the-hood"
          className="hidden rounded-md px-2 py-1 hover:text-foreground sm:inline"
        >
          Under the hood
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
