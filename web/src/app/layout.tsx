import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ParticlesBackground } from "@/components/particles-background";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentinel — Find and fix errors before they cause downtime",
  description:
    "Paste a crash log and get a plain-English briefing: what broke, why it happened, and a suggested fix.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "dark h-full font-sans antialiased",
        inter.variable,
        geistMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>
          <ParticlesBackground />
          <TooltipProvider>
            <div className="relative z-10 flex min-h-full flex-1 flex-col">
              {children}
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
