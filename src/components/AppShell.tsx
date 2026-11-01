"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import AuthGate from "./AuthGate";
import { CollectionsProvider } from "./collections";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ScrollProgress } from "./motion";
import { Footer, Header, ThemeProvider } from "./layout";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <CollectionsProvider>
          <AuthProvider>
            <ScrollProgress />
            <AuthGate
              shell={(page) => (
                <>
                  <Header />
                  <main className="mx-auto min-h-[70vh] max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
                    {page}
                  </main>
                  <Footer />
                </>
              )}
            >
              {children}
            </AuthGate>
          </AuthProvider>
        </CollectionsProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
