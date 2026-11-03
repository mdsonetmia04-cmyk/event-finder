"use client";

/* EarningsTracker: "date onujayi earning" inside the Asset Planner.
   Three accounts (Account 1 — Non AI, Account 2 — AI, Account 3 — Icons).
   Each user records, per date, their total approved assets + earning.
   What the user saves stays as-is until their next update; the card shows the
   latest entry per account plus its "last updated" date and full history.
   The super admin can click any student's name to view that student's
   earnings (read-only). Data lives in public.planner_earnings (RLS: own rows
   writable, super admin reads all). */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, CircleDollarSign, Images, Save, Sparkles, Trash2, User } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { todayISO } from "@/lib/date-engine";

type Account = "non_ai" | "ai" | "icons";
const ACCOUNTS: Account[] = ["non_ai", "ai", "icons"];

const ACCOUNT_ICON: Record<Account, typeof Sparkles> = {
  non_ai: Images,
  ai: Sparkles,
  icons: CircleDollarSign,
};

interface EarningEntry {
  id: string;
  user_id: string;
  account: Account;
  entry_date: string;
  approved_assets: number;
  earning: number;
  updated_at: string;
}

interface Student {
  id: string;
  name: string;
  full_name: string | null;
  whatsapp: string;
}

function displayNameOf(s: Student): string {
  return (s.full_name && s.full_name.trim()) || s.name;
}

export default function EarningsTracker() {
  const { session } = useAuth();
  const { t, lang } = useLang();
  const earn = t.planner.earn;
  const isSuper = session?.role === "super_admin";

  const [account, setAccount] = useState<Account>("non_ai");
  const [entries, setEntries] = useState<EarningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ date: todayISO(), assets: "", earning: "" });

  const viewerId = viewStudent?.id ?? session?.id ?? null;
  const readOnly = isSuper && viewStudent !== null;

  const loadEntries = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !viewerId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("planner_earnings")
      .select("id, user_id, account, entry_date, approved_assets, earning, updated_at")
      .eq("user_id", viewerId)
      .order("entry_date", { ascending: false });
    setEntries((data as EarningEntry[] | null) ?? []);
    setLoading(false);
  }, [viewerId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    // Super admin: load the approved-student roster for the name click-through.
    if (!isSuper) return;
    const supabase = getSupabase();
    if (!supabase) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, full_name, whatsapp")
        .eq("role", "student")
        .eq("status", "approved")
        .order("name", { ascending: true });
      setStudents((data as Student[] | null) ?? []);
    })();
  }, [isSuper]);

  const latestByAccount = useMemo(() => {
    const map = new Map<Account, EarningEntry>();
    for (const e of entries) {
      const cur = map.get(e.account);
      if (!cur || e.entry_date > cur.entry_date) map.set(e.account, cur ? (cur.entry_date > e.entry_date ? cur : e) : e);
    }
    return map;
  }, [entries]);

  const accountHistory = useMemo(
    () => entries.filter((e) => e.account === account),
    [entries, account]
  );

  const totals = useMemo(() => {
    let assets = 0;
    let earning = 0;
    for (const e of latestByAccount.values()) {
      assets += e.approved_assets;
      earning += Number(e.earning);
    }
    return { assets, earning };
  }, [latestByAccount]);

  const fmtDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const save = async () => {
    const supabase = getSupabase();
    if (!supabase || !session?.id || readOnly) return;
    const assets = Math.max(0, Math.floor(Number(form.assets) || 0));
    const earningVal = Math.max(0, Number(form.earning) || 0);
    if (!form.date) return;
    setSaving(true);
    const { error } = await supabase.from("planner_earnings").upsert(
      {
        user_id: session.id,
        account,
        entry_date: form.date,
        approved_assets: assets,
        earning: earningVal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,account,entry_date" }
    );
    setSaving(false);
    if (!error) {
      setForm((f) => ({ ...f, assets: "", earning: "" }));
      loadEntries();
    }
  };

  const remove = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase || readOnly) return;
    if (!confirm(earn.delConfirm)) return;
    await supabase.from("planner_earnings").delete().eq("id", id);
    loadEntries();
  };

  const latest = latestByAccount.get(account);

  return (
    <section className="earn-card card" aria-label={earn.title}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif-d flex items-center gap-2 text-xl font-semibold">
            <CalendarDays size={20} style={{ color: "var(--gold-deep)" }} />
            {earn.title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {readOnly && viewStudent ? displayNameOf(viewStudent) : earn.sub}
          </p>
        </div>
        <div className="earn-total">
          <span className="label">{earn.allTime}</span>
          <p className="font-serif-d mt-0.5 text-lg font-bold tabular-nums">
            {totals.assets.toLocaleString(lang === "bn" ? "bn-BD" : "en-US")} · ${totals.earning.toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Super admin: student picker */}
      {isSuper && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="label">{earn.pickStudent}</p>
            {viewStudent && (
              <button className="btn btn-ghost !text-xs" onClick={() => setViewStudent(null)}>
                <ChevronLeft size={13} /> {earn.backToMine}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {students.map((s) => (
              <button
                key={s.id}
                className={`btn !text-xs ${viewStudent?.id === s.id ? "btn-gold" : "btn-ghost"}`}
                onClick={() => setViewStudent(viewStudent?.id === s.id ? null : s)}
              >
                <User size={12} /> {displayNameOf(s)}
              </button>
            ))}
            {students.length === 0 && <span className="text-xs" style={{ color: "var(--muted)" }}>{earn.empty}</span>}
          </div>
          {!viewStudent && <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>{earn.pickStudentHint}</p>}
        </div>
      )}

      {/* Account tabs */}
      <div className="earn-tabs" role="tablist">
        {ACCOUNTS.map((a) => {
          const Icon = ACCOUNT_ICON[a];
          const l = latestByAccount.get(a);
          return (
            <button
              key={a}
              role="tab"
              aria-selected={account === a}
              className={`earn-tab ${account === a ? "earn-tab-active" : ""}`}
              onClick={() => setAccount(a)}
            >
              <Icon size={15} />
              <span>{earn.accounts[a]}</span>
              {l && (
                <span className="earn-tab-meta tabular-nums">
                  {l.approved_assets} · ${Number(l.earning).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm" style={{ color: "var(--muted)" }}>…</p>
      ) : (
        <>
          {/* Latest snapshot for the active account */}
          {latest ? (
            <div className="earn-latest">
              <div>
                <p className="label">{earn.assets}</p>
                <p className="font-serif-d text-2xl font-bold tabular-nums">{latest.approved_assets.toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}</p>
              </div>
              <div>
                <p className="label">{earn.earning}</p>
                <p className="font-serif-d text-2xl font-bold tabular-nums">${Number(latest.earning).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="earn-updated">
                <p className="text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>
                  {earn.lastUpdated(fmtDate(latest.entry_date))}
                </p>
              </div>
            </div>
          ) : (
            <p className="earn-empty">{earn.noData}</p>
          )}

          {/* Entry form (own data only) */}
          {!readOnly && (
            <div className="earn-form">
              <label>
                <span className="label">{earn.date}</span>
                <input type="date" className="input mt-1" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </label>
              <label>
                <span className="label">{earn.assets}</span>
                <input type="number" min={0} className="input mt-1" placeholder="0" value={form.assets} onChange={(e) => setForm((f) => ({ ...f, assets: e.target.value }))} />
              </label>
              <label>
                <span className="label">{earn.earning}</span>
                <input type="number" min={0} step="0.01" className="input mt-1" placeholder="0.00" value={form.earning} onChange={(e) => setForm((f) => ({ ...f, earning: e.target.value }))} />
              </label>
              <button className="btn btn-gold self-end" onClick={save} disabled={saving || !form.date}>
                <Save size={14} /> {saving ? earn.saving : earn.save}
              </button>
            </div>
          )}

          {/* History */}
          <div className="mt-4">
            <p className="label mb-2">{earn.history}</p>
            {accountHistory.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted)" }}>{earn.empty}</p>
            ) : (
              <div className="earn-history">
                {accountHistory.map((e) => (
                  <div key={e.id} className="earn-row">
                    <span className="tabular-nums font-semibold">{fmtDate(e.entry_date)}</span>
                    <span className="tabular-nums">{e.approved_assets.toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}</span>
                    <span className="tabular-nums">${Number(e.earning).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 })}</span>
                    {!readOnly && (
                      <button className="btn btn-ghost !px-1.5 !py-1" title={earn.del} aria-label={earn.del} onClick={() => remove(e.id)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
