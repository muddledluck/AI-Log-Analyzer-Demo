"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

type ProviderProps = React.ComponentProps<typeof NextThemesProvider> & {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const Provider = NextThemesProvider as React.ComponentType<ProviderProps>;

  return (
    <Provider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </Provider>
  );
}
