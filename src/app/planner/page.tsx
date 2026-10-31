"use client";

import { useMemo, useState } from "react";
import { ListPlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { EmptyState, SectionHeader } from "@/components/ui";
import { useCollections } from "@/components/collections";
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
        title="Asset Production Planner"
        subtitle="Turn opportunities into a production queue. Tasks persist in your browser."
        action={
          <button className="btn btn-gold !text-xs" onClick={() => { setShowForm((s) => !s); setEditingId(null); setForm(emptyForm); }}>
            {showForm ? <><X size={13} /> Close</> : <><Plus size={13} /> New task</>}
          </button>
        }
      />

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Active tasks", value: tasks.filter((t) => t.status !== "completed").length },
          { label: "Completed", value: tasks.filter((t) => t.status === "completed").length },
          { label: "Assets planned", value: totals.target },
          { label: "Overall progress", value: `${totals.pct}%` },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="label">{s.label}</p>
            <p className="font-serif-d mt-1 text-3xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--muted)" }}>
          <span>Portfolio production progress</span>
          <span className="tabular-nums">{totals.done}/{totals.target} assets</span>
        </div>
        <div className="progress"><div style={{ width: `${totals.pct}%` }} /></div>
      </div>

      {/* Quick add from production list */}
      {quickAdd.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">From your production list</p>
          <div className="flex flex-wrap gap-2">
            {quickAdd.map((e) => (
              <button
                key={e!.id}
                className="btn btn-ghost !text-xs"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...emptyForm, title: `Create assets for ${e!.name}`, eventId: e!.id });
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
            {editingId ? "Edit task" : "New production task"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">Task title *</span>
              <input className="input mt-1" placeholder="e.g. Create 50 Christmas vectors" value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </label>
            <label>
              <span className="label">Linked event</span>
              <select className="input mt-1" value={form.eventId} onChange={(e) => set({ eventId: e.target.value })}>
                <option value="">— none —</option>
                {EVENTS.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Asset category</span>
              <select className="input mt-1" value={form.assetCategory} onChange={(e) => set({ assetCategory: e.target.value })}>
                <option value="">— any —</option>
                {ASSET_CATEGORIES.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Target quantity</span>
              <input type="number" min={1} className="input mt-1" value={form.targetQuantity} onChange={(e) => set({ targetQuantity: Number(e.target.value) })} />
            </label>
            <label>
              <span className="label">Done so far</span>
              <input type="number" min={0} className="input mt-1" value={form.doneQuantity} onChange={(e) => set({ doneQuantity: Number(e.target.value) })} />
            </label>
            <label>
              <span className="label">Start date</span>
              <input type="date" className="input mt-1" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
            </label>
            <label>
              <span className="label">Deadline</span>
              <input type="date" className="input mt-1" value={form.deadline} onChange={(e) => set({ deadline: e.target.value })} />
            </label>
            <label>
              <span className="label">Status</span>
              <select className="input mt-1" value={form.status} onChange={(e) => set({ status: e.target.value as ProductionTask["status"] })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.replace("-", " ")}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Notes</span>
              <input className="input mt-1" placeholder="Style notes, references…" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-gold" onClick={submit} disabled={!form.title.trim()}>
              {editingId ? "Save changes" : "Add task"}
            </button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters + list */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="relative min-w-[180px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input className="input !pl-9" placeholder="Search tasks…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace("-", " ")}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={tasks.length === 0 ? "No production tasks yet" : "No tasks match the filters"}
          hint="Create your first task above — e.g. “Create 50 Christmas vectors” — and track it to completion."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => {
            const pct = t.targetQuantity ? Math.round((Math.min(t.doneQuantity, t.targetQuantity) / t.targetQuantity) * 100) : 0;
            const daysLeft = t.deadline ? daysBetween(todayISO(), t.deadline) : null;
            return (
              <div key={t.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{t.title}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                      {t.eventName ? `${t.eventName} · ` : ""}
                      {t.assetCategory || "Any asset type"} · {t.startDate} → {t.deadline || "—"}
                      {daysLeft !== null && (
                        <span className="font-semibold" style={{ color: daysLeft < 0 ? "#C0524D" : daysLeft <= 14 ? "#C98A2B" : "var(--muted)" }}>
                          {" "}· {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "due today" : `${daysLeft}d left`}
                        </span>
                      )}
                    </p>
                    {t.notes && <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>“{t.notes}”</p>}
                  </div>
                  <div className="flex items-center gap-1.5 no-print">
                    <span className={`chip !text-[11px] capitalize ${t.status === "completed" ? "!border-0" : ""}`}
                      style={t.status === "completed" ? { background: "rgba(47,158,110,.14)", color: "#2F9E6E" } : {}}>
                      {t.status.replace("-", " ")}
                    </span>
                    <button className="btn btn-ghost !px-2 !py-1.5" title="Edit" onClick={() => startEdit(t)}><Pencil size={13} /></button>
                    <button
                      className="btn btn-ghost !px-2 !py-1.5"
                      title={t.status === "completed" ? "Reopen" : "Mark completed"}
                      onClick={() => updateTask(t.id, { status: t.status === "completed" ? "in-progress" : "completed", doneQuantity: t.status === "completed" ? t.doneQuantity : t.targetQuantity })}
                    >
                      ✓
                    </button>
                    <button className="btn btn-ghost !px-2 !py-1.5" title="Delete" onClick={() => { if (confirm("Delete this task?")) deleteTask(t.id); }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="progress flex-1"><div style={{ width: `${pct}%` }} /></div>
                  <div className="flex items-center gap-1.5 text-xs tabular-nums no-print">
                    <button className="btn btn-ghost !px-2 !py-0.5" onClick={() => updateTask(t.id, { doneQuantity: Math.max(0, t.doneQuantity - 1) })} aria-label="Decrease">−</button>
                    <span className="w-16 text-center font-semibold">{t.doneQuantity}/{t.targetQuantity}</span>
                    <button className="btn btn-ghost !px-2 !py-0.5" onClick={() => updateTask(t.id, { doneQuantity: Math.min(t.targetQuantity, t.doneQuantity + 1) })} aria-label="Increase">+</button>
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
          <p className="label mb-2">Production list ({productionList.length})</p>
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
