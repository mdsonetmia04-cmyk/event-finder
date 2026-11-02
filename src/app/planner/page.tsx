"use client";

/* Planner: a warm Fitplan-style greeting hero with a seasonal illustration,
   then the production queue as a 4-stage kanban pipeline —
   To Shoot → Editing → Ready → Uploaded. */

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Flame, ListPlus, Pencil, Plus, Search, Target, Trash2, TrendingUp, X } from "lucide-react";
import { EmptyState, SectionHeader } from "@/components/ui";
import { useCollections } from "@/components/collections";
import { useLang } from "@/i18n/LanguageContext";
import { ASSET_CATEGORIES, EVENTS, eventById } from "@/lib/data";
import { daysBetween, todayISO } from "@/lib/date-engine";
import type { ProductionTask } from "@/types/event";

const STAGES = ["to-shoot", "editing", "ready", "uploaded"] as const;
type Stage = (typeof STAGES)[number];

/* Per-stage accent colors for the kanban pipeline. */
const STAGE_COLORS: Record<Stage, string> = {
  "to-shoot": "var(--gold-soft)",
  editing: "var(--gold)",
  ready: "var(--gold-deep)",
  uploaded: "#2F9E6E",
};

type Season = "spring" | "summer" | "autumn" | "winter";

function dhakaNow(): { hour: number; month: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      hour: "numeric",
      month: "numeric",
      hour12: false,
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return { hour: Number(parts.hour) % 24, month: Number(parts.month) };
}

function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/* Hand-drawn seasonal vignettes in gold + ink. The art follows the season. */
function SeasonArt({ season }: { season: Season }) {
  const gold = "var(--gold)";
  const ink = "var(--text)";
  const soft = "var(--gold-deep)";
  if (season === "spring") {
    const blossoms: [number, number][] = [[148, 52], [168, 74], [128, 78], [110, 52], [88, 88]];
    return (
      <svg viewBox="0 0 200 140" className="season-art" aria-hidden="true">
        <path d="M18 128 C 60 118, 92 92, 150 62" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M84 102 C 96 92, 100 78, 104 62" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M120 84 C 132 78, 140 68, 146 56" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        {blossoms.map(([x, y], i) => (
          <g key={i} stroke={gold} strokeWidth={2} fill="none">
            <circle cx={x - 6} cy={y} r={4.5} />
            <circle cx={x + 6} cy={y} r={4.5} />
            <circle cx={x} cy={y - 6} r={4.5} />
            <circle cx={x} cy={y + 6} r={4.5} />
            <circle cx={x} cy={y} r={2.2} fill={soft} stroke="none" />
          </g>
        ))}
      </svg>
    );
  }
  if (season === "summer") {
    return (
      <svg viewBox="0 0 200 140" className="season-art" aria-hidden="true">
        <circle cx={100} cy={56} r={24} fill="none" stroke={gold} strokeWidth={3.5} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = 100 + 32 * Math.cos(a);
          const y1 = 56 + 32 * Math.sin(a);
          const x2 = 100 + 42 * Math.cos(a);
          const y2 = 56 + 42 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={gold} strokeWidth={3} strokeLinecap="round" />;
        })}
        <path d="M8 118 Q 55 88, 105 112 T 192 108" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
        <path d="M30 128 Q 80 112, 130 124" fill="none" stroke={soft} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      </svg>
    );
  }
  if (season === "autumn") {
    const leaves: [number, number, number][] = [[60, 40, 30], [105, 28, -20], [145, 55, 45], [80, 80, -40], [125, 95, 15], [45, 95, 60]];
    return (
      <svg viewBox="0 0 200 140" className="season-art" aria-hidden="true">
        <path d="M20 20 C 70 50, 120 60, 185 45" fill="none" stroke={soft} strokeWidth={2} strokeDasharray="1 7" strokeLinecap="round" opacity={0.8} />
        <path d="M15 70 C 70 95, 130 100, 190 85" fill="none" stroke={soft} strokeWidth={2} strokeDasharray="1 7" strokeLinecap="round" opacity={0.6} />
        {leaves.map(([x, y, r], i) => (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={11}
            ry={6.5}
            fill="none"
            stroke={i % 2 ? gold : ink}
            strokeWidth={2.5}
            transform={`rotate(${r} ${x} ${y})`}
          />
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 140" className="season-art" aria-hidden="true">
      <circle cx={158} cy={34} r={14} fill="none" stroke={gold} strokeWidth={3} opacity={0.85} />
      <path d="M30 120 C 55 100, 70 80, 78 52" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M52 96 L 34 84 M62 82 L 46 66 M70 68 L 88 58" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M100 108 H 185 M85 122 H 160 M115 94 H 175" stroke={soft} strokeWidth={2.5} strokeLinecap="round" opacity={0.55} />
    </svg>
  );
}

function PlannerHero({ active, dueThisWeek, pct }: { active: number; dueThisWeek: number; pct: number }) {
  const { t, lang } = useLang();
  const { hour, month } = dhakaNow();
  const locale = lang === "bn" ? "bn-BD" : "en-US";
  const dateStr = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const R = 34;
  const CIRC = 2 * Math.PI * R;
  return (
    <div className="planner-hero card">
      <div className="min-w-0">
        <p className="planner-hero-kicker">{dateStr}</p>
        <h2 className="font-serif-d mt-1 font-semibold leading-tight">
          {t.planner.greet(hour)}, {t.planner.heroName}
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          {t.planner.heroSub(active, dueThisWeek)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {/* Overall completion ring */}
        <div className="relative hidden sm:block" role="img" aria-label={`${pct}%`}>
          <svg width="92" height="92" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
            <circle
              cx="48"
              cy="48"
              r={R}
              fill="none"
              stroke="url(#plannerRing)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${(Math.min(100, Math.max(0, pct)) / 100) * CIRC} ${CIRC}`}
              transform="rotate(-90 48 48)"
              style={{ transition: "stroke-dasharray 0.5s ease", filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--gold) 55%, transparent))" }}
            />
            <defs>
              <linearGradient id="plannerRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--gold-soft)" />
                <stop offset="55%" stopColor="var(--gold)" />
                <stop offset="100%" stopColor="var(--gold-deep)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="font-serif-d absolute inset-0 flex items-center justify-center text-[17px] font-bold tabular-nums">
            {pct}%
          </span>
        </div>
        <SeasonArt season={seasonOf(month)} />
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onPatch,
  onMove,
}: {
  task: ProductionTask;
  onEdit: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<ProductionTask>) => void;
  onMove: (dir: 1 | -1) => void;
}) {
  const { t, lang } = useLang();
  const pct = task.targetQuantity
    ? Math.round((Math.min(task.doneQuantity, task.targetQuantity) / task.targetQuantity) * 100)
    : 0;
  const daysLeft = task.deadline ? daysBetween(todayISO(), task.deadline) : null;
  const stageIdx = STAGES.indexOf(task.status);
  return (
    <div className="kanban-card">
      <p className="kanban-card-title">{task.title}</p>
      <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {task.eventName ? `${task.eventName} · ` : ""}
        {task.assetCategory || t.planner.fAny}
        {daysLeft !== null && (
          <>
            {" · "}
            <strong style={{ color: daysLeft < 0 ? "#C0524D" : daysLeft <= 7 ? "var(--gold-deep)" : "var(--muted)" }}>
              {daysLeft < 0 ? t.planner.dOverdue(Math.abs(daysLeft)) : daysLeft === 0 ? t.planner.dueToday : t.planner.dLeft(daysLeft)}
            </strong>
          </>
        )}
      </p>
      {task.notes && <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>“{task.notes}”</p>}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="progress flex-1">
          <div style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-1 text-xs tabular-nums">
          <button className="btn btn-ghost !px-1.5 !py-0.5" onClick={() => onPatch({ doneQuantity: Math.max(0, task.doneQuantity - 1) })} aria-label="Decrease">−</button>
          <span className="font-semibold">{task.doneQuantity}/{task.targetQuantity}</span>
          <button className="btn btn-ghost !px-1.5 !py-0.5" onClick={() => onPatch({ doneQuantity: Math.min(task.targetQuantity, task.doneQuantity + 1) })} aria-label="Increase">+</button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button className="btn btn-ghost !px-1.5 !py-1" title={t.planner.movePrev} disabled={stageIdx <= 0} onClick={() => onMove(-1)} aria-label={t.planner.movePrev}>
            <ChevronLeft size={14} />
          </button>
          <button className="btn btn-ghost !px-1.5 !py-1" title={t.planner.moveNext} disabled={stageIdx >= STAGES.length - 1} onClick={() => onMove(1)} aria-label={t.planner.moveNext}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-ghost !px-1.5 !py-1" title={t.planner.editT} onClick={onEdit} aria-label={t.planner.editT}>
            <Pencil size={13} />
          </button>
          <button
            className="btn btn-ghost !px-1.5 !py-1"
            title={t.planner.cancel}
            aria-label={t.planner.cancel}
            onClick={() => {
              if (confirm(lang === "bn" ? "এই টাস্ক মুছে ফেলবেন?" : "Delete this task?")) onDelete();
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

const emptyForm = {
  title: "",
  eventId: "",
  assetCategory: "",
  targetQuantity: 50,
  doneQuantity: 0,
  startDate: todayISO(),
  deadline: "",
  status: "to-shoot" as Stage,
  notes: "",
};

export default function PlannerPage() {
  const { tasks, addTask, updateTask, deleteTask, productionList, toggleProduction } = useCollections();
  const { t, lang } = useLang();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");

  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));

  const startEdit = (t: ProductionTask) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      eventId: t.eventId ?? "",
      assetCategory: t.assetCategory,
      targetQuantity: t.targetQuantity,
      doneQuantity: t.doneQuantity,
      startDate: t.startDate,
      deadline: t.deadline,
      status: t.status,
      notes: t.notes,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      updateTask(editingId, {
        title: form.title.trim(),
        eventId: form.eventId || undefined,
        eventName: form.eventId ? eventById[form.eventId]?.name : undefined,
        assetCategory: form.assetCategory,
        targetQuantity: Math.max(1, form.targetQuantity),
        doneQuantity: Math.max(0, Math.min(form.doneQuantity, Math.max(1, form.targetQuantity))),
        startDate: form.startDate,
        deadline: form.deadline,
        status: form.status,
        notes: form.notes.trim(),
      });
    } else {
      addTask({
        title: form.title.trim(),
        eventId: form.eventId || undefined,
        eventName: form.eventId ? eventById[form.eventId]?.name : undefined,
        assetCategory: form.assetCategory,
        targetQuantity: Math.max(1, form.targetQuantity),
        doneQuantity: 0,
        startDate: form.startDate,
        deadline: form.deadline || form.startDate,
        status: "to-shoot",
        notes: form.notes.trim(),
      });
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const moveTask = (task: ProductionTask, dir: 1 | -1) => {
    const i = STAGES.indexOf(task.status) + dir;
    if (i < 0 || i >= STAGES.length) return;
    const patch: Partial<ProductionTask> = { status: STAGES[i] };
    if (STAGES[i] === "uploaded") patch.doneQuantity = task.targetQuantity;
    updateTask(task.id, patch);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => !q || `${t.title} ${t.eventName ?? ""} ${t.notes}`.toLowerCase().includes(q))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [tasks, query]);

  const columns = useMemo(() => {
    const map = new Map<Stage, ProductionTask[]>();
    for (const s of STAGES) map.set(s, []);
    for (const t of filtered) map.get(t.status)?.push(t);
    return map;
  }, [filtered]);

  const totals = useMemo(() => {
    const target = tasks.reduce((s, t) => s + t.targetQuantity, 0);
    const done = tasks.reduce((s, t) => s + Math.min(t.doneQuantity, t.targetQuantity), 0);
    return { target, done, pct: target ? Math.round((done / target) * 100) : 0 };
  }, [tasks]);

  const dueThisWeek = useMemo(() => {
    const today = todayISO();
    return tasks.filter((t) => {
      if (t.status === "uploaded" || !t.deadline) return false;
      const d = daysBetween(today, t.deadline);
      return d >= 0 && d <= 7;
    }).length;
  }, [tasks]);

  const quickAdd = productionList
    .map((id) => eventById[id])
    .filter(Boolean)
    .filter((e) => !tasks.some((t) => t.eventId === e!.id));

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title={t.planner.title}
        subtitle={t.planner.sub}
        action={
          <button className="btn btn-gold !text-xs" onClick={() => { setShowForm((s) => !s); setEditingId(null); setForm(emptyForm); }}>
            {showForm ? <><X size={13} /> {t.planner.close}</> : <><Plus size={13} /> {t.planner.newTask}</>}
          </button>
        }
      />

      <PlannerHero
        active={tasks.filter((ta) => ta.status !== "uploaded").length}
        dueThisWeek={dueThisWeek}
        pct={totals.pct}
      />

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: t.planner.sActive, value: tasks.filter((ta) => ta.status !== "uploaded").length, icon: Flame },
          { label: t.planner.sCompleted, value: tasks.filter((ta) => ta.status === "uploaded").length, icon: CheckCircle2 },
          { label: t.planner.sPlanned, value: totals.target, icon: Target },
          { label: t.planner.sProgress, value: `${totals.pct}%`, icon: TrendingUp },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card group relative overflow-hidden p-4">
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px] opacity-80"
                style={{ background: "linear-gradient(90deg, var(--gold-soft), var(--gold), var(--gold-deep))" }}
                aria-hidden="true"
              />
              <span
                className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: "color-mix(in srgb, var(--gold) 13%, transparent)", color: "var(--gold-deep)" }}
              >
                <Icon size={17} />
              </span>
              <p className="label">{s.label}</p>
              <p className="font-serif-d mt-1 text-3xl font-bold tabular-nums">{s.value}</p>
            </div>
          );
        })}
      </div>
      <div className="card p-4">
        <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--muted)" }}>
          <span>{t.planner.progressLabel}</span>
          <span className="tabular-nums">{t.planner.assetsOf(totals.done, totals.target)}</span>
        </div>
        <div className="progress"><div style={{ width: `${totals.pct}%` }} /></div>
      </div>

      {/* Quick add from production list */}
      {quickAdd.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">{t.planner.fromProd}</p>
          <div className="flex flex-wrap gap-2">
            {quickAdd.map((e) => (
              <button
                key={e!.id}
                className="btn btn-ghost !text-xs"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...emptyForm, title: lang === "bn" ? `${e!.name} এর জন্য অ্যাসেট তৈরি করুন` : `Create assets for ${e!.name}`, eventId: e!.id });
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <ListPlus size={13} /> {e!.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card rise p-5">
          <h3 className="font-serif-d mb-4 text-lg font-semibold">
            {editingId ? t.planner.editT : t.planner.formT}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">{t.planner.fTitle}</span>
              <input className="input mt-1" placeholder={t.planner.fTitlePh} value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </label>
            <label>
              <span className="label">{t.planner.fEvent}</span>
              <select className="input mt-1" value={form.eventId} onChange={(e) => set({ eventId: e.target.value })}>
                <option value="">{t.planner.fNone}</option>
                {EVENTS.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">{t.planner.fCategory}</span>
              <select className="input mt-1" value={form.assetCategory} onChange={(e) => set({ assetCategory: e.target.value })}>
                <option value="">{t.planner.fAny}</option>
                {ASSET_CATEGORIES.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">{t.planner.fTarget}</span>
              <input type="number" min={1} className="input mt-1" value={form.targetQuantity} onChange={(e) => set({ targetQuantity: Number(e.target.value) })} />
            </label>
            <label>
              <span className="label">{t.planner.fDone}</span>
              <input type="number" min={0} className="input mt-1" value={form.doneQuantity} onChange={(e) => set({ doneQuantity: Number(e.target.value) })} />
            </label>
            <label>
              <span className="label">{t.planner.fStart}</span>
              <input type="date" className="input mt-1" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
            </label>
            <label>
              <span className="label">{t.planner.fDeadline}</span>
              <input type="date" className="input mt-1" value={form.deadline} onChange={(e) => set({ deadline: e.target.value })} />
            </label>
            <label>
              <span className="label">{t.planner.fStatus}</span>
              <select className="input mt-1" value={form.status} onChange={(e) => set({ status: e.target.value as Stage })}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>{t.planner.stages[s] ?? s}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">{t.planner.fNotes}</span>
              <input className="input mt-1" placeholder={t.planner.fNotesPh} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-gold" onClick={submit} disabled={!form.title.trim()}>
              {editingId ? t.planner.saveChanges : t.planner.addTask}
            </button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
              {t.planner.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="relative min-w-[180px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input className="input !pl-9" placeholder={t.planner.searchPh} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {/* Kanban pipeline */}
      {tasks.length === 0 ? (
        <EmptyState title={t.planner.emptyT1} hint={t.planner.emptyH} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t.planner.emptyT2} hint={t.planner.emptyH} />
      ) : (
        <div className="kanban-board">
          {STAGES.map((s) => (
            <section key={s} className="kanban-col" aria-label={t.planner.stages[s] ?? s}>
              <header className="kanban-col-head">
                <span
                  className="kanban-dot"
                  style={{
                    background: STAGE_COLORS[s],
                    boxShadow: `0 0 10px ${STAGE_COLORS[s]}`,
                  }}
                  aria-hidden="true"
                />
                <h3 className="kanban-col-title">{t.planner.stages[s] ?? s}</h3>
                <span className="kanban-count tabular-nums">{columns.get(s)?.length ?? 0}</span>
              </header>
              <div className="kanban-col-body">
                {(columns.get(s) ?? []).length === 0 ? (
                  <p className="kanban-empty" aria-hidden="true">—</p>
                ) : (
                  (columns.get(s) ?? []).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => startEdit(task)}
                      onDelete={() => deleteTask(task.id)}
                      onPatch={(patch) => updateTask(task.id, patch)}
                      onMove={(dir) => moveTask(task, dir)}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Production list manager */}
      {productionList.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">{t.planner.prodList(productionList.length)}</p>
          <div className="flex flex-wrap gap-1.5">
            {productionList.map((id) => (
              <span key={id} className="chip">
                {eventById[id]?.name ?? id}
                <button onClick={() => toggleProduction(id)} aria-label="Remove" className="ml-1 hover:opacity-70"><X size={11} /></button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
