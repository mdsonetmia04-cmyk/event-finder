"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  Upload,
} from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import { CONTRIBUTOR_FACTS } from "@/data/contributor-facts";
import { EVENTS, META } from "@/lib/data";
import { eventsToCSV, validateEvents, type ValidationIssue } from "@/lib/event-validator";
import type { StockEvent } from "@/types/event";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SourcesPanel() {
  const issues = useMemo(() => validateEvents(), []);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  const uniqueSources = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of EVENTS) for (const s of e.sources) map.set(s.url, s.label);
    return [...map.entries()];
  }, []);

  const provisionalCount = EVENTS.filter((e) => e.dateStatus === "provisional").length;

  const [importResult, setImportResult] = useState<{
    name: string;
    count: number;
    issues: ValidationIssue[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useLang();

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr: StockEvent[] = Array.isArray(parsed) ? parsed : parsed.events;
      if (!Array.isArray(arr)) throw new Error("Expected a JSON array of events or {events: [...]}");
      setImportResult({ name: file.name, count: arr.length, issues: validateEvents(arr) });
    } catch (err) {
      setImportResult({
        name: file.name,
        count: 0,
        issues: [{ level: "error", eventId: "(file)", message: `Could not parse: ${(err as Error).message}` }],
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={t.sources.title}
        subtitle={t.sources.sub}
      />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: t.sources.sEvents, value: EVENTS.length, icon: Database },
          { label: t.sources.sMarkets, value: META.countryCount, icon: Database },
          { label: t.sources.sYears, value: META.years.join(", "), icon: Database },
          { label: t.sources.sProv, value: provisionalCount, icon: AlertTriangle },
          { label: t.sources.sUpdated, value: META.lastResearchUpdate, icon: RefreshCw },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="label">{s.label}</p>
            <p className="font-serif-d mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Validation */}
      <div className="card p-5">
        <h3 className="font-serif-d mb-2 text-lg font-semibold">{t.sources.validation}</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="chip" style={{ borderColor: "#2F9E6E", color: "#2F9E6E" }}>
            <CheckCircle2 size={13} /> {errors.length} {t.sources.errors}
          </span>
          <span className="chip" style={{ borderColor: "#C98A2B", color: "#C98A2B" }}>
            <AlertTriangle size={13} /> {warnings.length} {t.sources.warnings}
          </span>
        </div>
        {warnings.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium" style={{ color: "var(--steel-deep)" }}>
              {t.sources.viewWarnings(warnings.length)}
            </summary>
            <ul className="mt-2 grid max-h-48 gap-1 overflow-y-auto text-xs" style={{ color: "var(--muted)" }}>
              {warnings.slice(0, 50).map((w, i) => (
                <li key={i}>· [{w.eventId}] {w.message}</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* Adobe contributor guidelines */}
      <section>
        <h3 className="font-serif-d mb-3 text-xl font-semibold">{t.sources.guidelines}</h3>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          {t.sources.guidelinesSub(META.lastResearchUpdate)}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {CONTRIBUTOR_FACTS.map((sec) => (
            <div key={sec.title} className="card p-4">
              <p className="mb-2 font-semibold">{sec.title}</p>
              <ul className="grid gap-1 text-[13px]" style={{ color: "var(--muted)" }}>
                {sec.facts.map((f) => (
                  <li key={f} className="flex gap-1.5"><span style={{ color: "var(--gold-deep)" }}>•</span> {f}</li>
                ))}
              </ul>
              <div className="mt-2 flex flex-col gap-0.5">
                {sec.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="truncate text-xs hover:underline" style={{ color: "var(--steel-deep)" }}>
                    {s.label} ↗
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Event sources */}
      <section>
        <h3 className="font-serif-d mb-3 text-xl font-semibold">{t.sources.eventSources}</h3>
        <div className="card p-4">
          {uniqueSources.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Core holiday dates come from standard public holiday calendars (timeanddate.com and
              official government calendars). Verify dates against official sources before final upload pushes.
            </p>
          ) : (
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
              {uniqueSources.map(([url, label]) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--steel-deep)" }}>
                    {label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Freshness */}
      <div className="card p-5">
        <h3 className="font-serif-d mb-2 text-lg font-semibold">{t.sources.freshness}</h3>
        <ul className="grid gap-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          <li>· <strong style={{ color: "var(--text)" }}>Last research update: {META.lastResearchUpdate}.</strong> Re-verify lunar/religious dates yearly, they shift with moon sightings.</li>
          <li>· Dates marked <strong style={{ color: "var(--text)" }}>provisional</strong> are estimates shown honestly; confirmed dates come from official calendars or certain calendar rules.</li>
          <li>· To update: edit <code>scripts/event-defs.mjs</code>, run <code>npm run build:data</code>, then rebuild and redeploy.</li>
          <li>· {META.disclaimer}</li>
        </ul>
      </div>

      {/* Admin: export / import */}
      <div className="card p-5">
        <h3 className="font-serif-d mb-1 text-lg font-semibold">{t.sources.admin}</h3>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          {t.sources.adminSub}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-ghost !text-xs"
            onClick={() => download("stockseason-events.json", JSON.stringify(EVENTS, null, 1), "application/json")}
          >
            <FileJson size={14} /> {t.sources.exportJson}
          </button>
          <button
            className="btn btn-ghost !text-xs"
            onClick={() => download("stockseason-events.csv", eventsToCSV(), "text/csv")}
          >
            <FileSpreadsheet size={14} /> {t.sources.exportCsv}
          </button>
          <button className="btn btn-ghost !text-xs" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> {t.sources.validateImport}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
        </div>

        {importResult && (
          <div className="rise mt-4 rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--surface2)" }}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Download size={14} /> {t.sources.importSummary(importResult.name, importResult.count)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="chip" style={{ borderColor: "#2F9E6E", color: "#2F9E6E" }}>
                {importResult.issues.filter((i) => i.level === "error").length} {t.sources.errors}
              </span>
              <span className="chip" style={{ borderColor: "#C98A2B", color: "#C98A2B" }}>
                {importResult.issues.filter((i) => i.level === "warning").length} {t.sources.warnings}
              </span>
            </div>
            {importResult.issues.length > 0 && (
              <ul className="mt-2 grid max-h-40 gap-1 overflow-y-auto text-xs" style={{ color: "var(--muted)" }}>
                {importResult.issues.slice(0, 40).map((w, i) => (
                  <li key={i}>· [{w.level}] [{w.eventId}] {w.message}</li>
                ))}
              </ul>
            )}
            {importResult.issues.filter((i) => i.level === "error").length === 0 && importResult.count > 0 && (
              <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                {t.sources.valid}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
