"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, type Dict, type Lang } from "./dictionaries";
import { KEYS } from "@/lib/store";

const LANG_KEY = "ssi-lang";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const Ctx = createContext<LangCtx>({ lang: "en", setLang: () => {}, t: dictionaries.en });

export function useLang(): LangCtx {
  return useContext(Ctx);
}

/** Translated "x days left / ago" label for a daysUntil value. */
export function useDaysLabel() {
  const { t } = useLang();
  return useCallback(
    (daysUntil: number): string => {
      if (daysUntil < 0) return t.days.ago(Math.abs(daysUntil));
      if (daysUntil === 0) return t.days.today;
      if (daysUntil === 1) return t.days.tomorrow;
      return t.days.in(daysUntil);
    },
    [t]
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Lang | null;
      if (saved === "bn" || saved === "en") setLangState(saved);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
    document.documentElement.classList.toggle("lang-bn", lang === "bn");
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const value = useMemo(() => ({ lang, setLang, t: dictionaries[lang] }), [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
