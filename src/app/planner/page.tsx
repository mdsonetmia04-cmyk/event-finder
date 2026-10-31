"use client";

import { useMemo, useState } from "react";
import { ListPlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { EmptyState, SectionHeader } from "@/components/ui";
import { useCollections } from "@/components/collections";
import { useLang } from "@/i18n/LanguageContext";
import { ASSET_CATEGORIES, EVENTS, eventById } from "@/lib/data";
import { daysBetween, todayISO } from "@/lib/date-engine";
import type { ProductionTask } from "@/types/event";

const STATUSES = ["planned", "in-progress", "completed"] as const;

const emptyForm = {
  title: "",
  eventId: "",
  assetCategory: "",
  targetQuantity: 50,
  doneQuantity: 0,
  startDate: todayISO(),
  deadline: "",
  status: "planned" as ProductionTask["status"],
  notes: "",
};

export default function PlannerPage() {
  const { tasks, addTask, updateTask, deleteTask, productionList, toggleProduction } = useCollections();
  const { t, lang } = useLang();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
        status: "planned",
        notes: form.notes.trim(),
      });
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => !statusFilter || t.status === statusFilter)
      .filter((t) => !q || `${t.title} ${t.eventName ?? ""} ${t.notes}`.toLowerCase().includes(q))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [tasks, query, statusFilter]);

  const totals = useMemo(() => {
    const target = tasks.reduce((s, t) => s + t.targetQuantity, 0);
    const done = tasks.reduce((s, t) => s + Math.min(t.doneQuantity, t.targetQuantity), 0);
    return { target, done, pct: target ? Math.round((done / target) * 100) : 0 };
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

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: t.planner.sActive, value: tasks.filter((ta) => ta.status !== "completed").length },
          { label: t.planner.sCompleted, value: tasks.filter((ta) => ta.status === "completed").length },
          { label: t.planner.sPlanned, value: totals.target },
          { label: t.planner.sProgress, value: `${totals.pct}%` },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="label">{s.label}</p>
            <p className="font-serif-d mt-1 text-3xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
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
              <select className="input mt-1" value={form.status} onChange={(e) => set({ status: e.target.value as ProductionTask["status"] })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{t.planner.statuses[s] ?? s}</option>
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

      {/* Filters + list */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="relative min-w-[180px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input className="input !pl-9" placeholder={t.planner.searchPh} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={t.planner.allStatuses}>
          <option value="">{t.planner.allStatuses}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{t.planner.statuses[s] ?? s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={tasks.length === 0 ? t.planner.emptyT1 : t.planner.emptyT2}
          hint={t.planner.emptyH}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((task) => {
            const pct = task.targetQuantity ? Math.round((Math.min(task.doneQuantity, task.targetQuantity) / task.targetQuantity) * 100) : 0;
            const daysLeft = task.deadline ? daysBetween(todayISO(), task.deadline) : null;
            return (
              <div key={task.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{task.title}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                      {task.eventName ? `${task.eventName} · ` : ""}
                      {task.assetCategory || t.planner.fAny} · {task.startDate} → {task.deadline || "—"}
                      {daysLeft !== null && (
                        <span className="font-semibold" style={{ color: daysLeft < 0 ? "#C0524D" : daysLeft <= 14 ? "#C98A2B" : "var(--muted)" }}>
                          {" "}· {daysLeft < 0 ? t.planner.dOverdue(Math.abs(daysLeft)) : daysLeft === 0 ? t.planner.dueToday : t.planner.dLeft(daysLeft)}
                        </span>
                      )}
                    </p>
                    {task.notes && <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>“{task.notes}”</p>}
                  </div>
                  <div className="flex items-center gap-1.5 no-print">
                    <span className={`chip !text-[11px] capitalize ${task.status === "completed" ? "!border-0" : ""}`}
                      style={task.status === "completed" ? { background: "rgba(47,158,110,.14)", color: "#2F9E6E" } : {}}>
                      {t.planner.statuses[task.status] ?? task.status}
                    </span>
                    <button className="btn btn-ghost !px-2 !py-1.5" title={t.planner.editT} onClick={() => startEdit(task)}><Pencil size={13} /></button>
                    <button
                      className="btn btn-ghost !px-2 !py-1.5"
                      title={task.status === "completed" ? t.planner.statuses["in-progress"] : t.planner.statuses.completed}
                      onClick={() => updateTask(task.id, { status: task.status === "completed" ? "in-progress" : "completed", doneQuantity: task.status === "completed" ? task.doneQuantity : task.targetQuantity })}
                    >
                      ✓
                    </button>
                    <button className="btn btn-ghost !px-2 !py-1.5" title={t.planner.cancel} onClick={() => { if (confirm(lang === "bn" ? "এই টাস্ক মুছে ফেলবেন?" : "Delete this task?")) deleteTask(task.id); }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="progress flex-1"><div style={{ width: `${pct}%` }} /></div>
                  <div className="flex items-center gap-1.5 text-xs tabular-nums no-print">
                    <button className="btn btn-ghost !px-2 !py-0.5" onClick={() => updateTask(task.id, { doneQuantity: Math.max(0, task.doneQuantity - 1) })} aria-label="Decrease">−</button>
                    <span className="w-16 text-center font-semibold">{task.doneQuantity}/{task.targetQuantity}</span>
                    <button className="btn btn-ghost !px-2 !py-0.5" onClick={() => updateTask(task.id, { doneQuantity: Math.min(task.targetQuantity, task.doneQuantity + 1) })} aria-label="Increase">+</button>
                  </div>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--muted)" }}>{pct}%</span>
                </div>
              </div>
            );
          })}
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
