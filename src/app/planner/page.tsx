"use client";

/* Galaxy: a hub of SONET's websites as cards.
   Clicking a card opens that website inside Galaxy as a page
   (iframe), so the site runs inside Sweet Smart Calendar.
   No earnings, no names, no tasks and no portfolio progress here —
   those were removed on purpose. Add a new website by adding
   one entry to SITES below. */

import { useState } from "react";
import { ArrowLeft, ExternalLink, Globe2, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";

type GalaxySite = {
  id: string;
  name: string;
  desc: string;
  url: string;
  repo: string;
};

export default function GalaxyPage() {
  const { t } = useLang();
  const [active, setActive] = useState<GalaxySite | null>(null);

  const sites: GalaxySite[] = [
    {
      id: "prompt-guru",
      name: "Prompt Guru",
      desc: t.planner.promptGuruDesc,
      url: "https://promptguru-two.vercel.app/",
      repo: "https://github.com/mdsonetmia04-cmyk/promptguru",
    },
  ];

  if (active) {
    return (
      <div className="flex flex-col gap-4">
        <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
          <button type="button" className="btn btn-ghost !px-2.5" onClick={() => setActive(null)}>
            <ArrowLeft size={15} /> {t.planner.back}
          </button>
          <span className="font-serif-d text-lg font-semibold">{active.name}</span>
          <a
            className="ml-auto text-xs font-medium hover:underline"
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--steel-deep)" }}
          >
            {t.planner.openDirect} <ExternalLink size={12} className="inline" />
          </a>
        </div>
        <div className="card overflow-hidden p-0">
          <iframe
            src={active.url}
            title={active.name}
            className="block h-[72vh] min-h-[560px] w-full border-0 bg-white"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title={t.planner.title} subtitle={t.planner.sub} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <button key={site.id} type="button" onClick={() => setActive(site)} className="card card-hover p-5 text-left">
            <span
              className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}
            >
              <Sparkles size={22} />
            </span>
            <span className="block font-serif-d text-lg font-semibold">{site.name}</span>
            <span className="mt-1 block text-sm" style={{ color: "var(--muted)" }}>
              {site.desc}
            </span>
            <span className="mt-4 block text-xs font-semibold" style={{ color: "var(--steel-deep)" }}>
              {t.planner.openInside} →
            </span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
        <Globe2 size={14} className="mr-1 inline" /> {t.planner.moreComing}
      </p>
    </div>
  );
}
