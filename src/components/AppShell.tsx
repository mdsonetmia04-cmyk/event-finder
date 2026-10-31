"use client";

import type { ReactNode } from "react";
import { CollectionsProvider } from "./collections";
import { Footer, Header, ThemeProvider } from "./layout";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CollectionsProvider>
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
          {children}
        </main>
        <Footer />
      </CollectionsProvider>
    </ThemeProvider>
  );
}
