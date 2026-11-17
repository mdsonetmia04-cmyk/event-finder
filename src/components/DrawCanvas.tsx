"use client";

/* Drawing canvas for Draw & Guess.
   - The drawer draws with Pointer Events (mouse + touch) on an HTML
     canvas scaled for devicePixelRatio; points are stored normalised
     (0..1) so strokes render identically on every screen size.
   - Strokes stream to guessers over a Supabase Realtime broadcast
     channel (one event per flush, ~every 50ms while drawing, plus a
     final flush on pointer-up). Each event carries the full stroke
     header, so a missed first event never strands later points.
   - Guessers' canvases are read-only: no pointer handlers, no
     toolbar. Strokes are ephemeral — a player who joins mid-round
     sees strokes from join time onward (documented limitation).
   - Eraser strokes replay with destination-out compositing, in order,
     so a full redraw matches the live view exactly. */

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Eraser, Trash2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

/** A point in normalised canvas space (0..1 in both axes). */
export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawStrokeHeader {
  id: string;
  color: string;
  /** Brush width as a fraction of the canvas width. */
  size: number;
  eraser: boolean;
}

/** Broadcast events exchanged on the per-room Realtime channel. */
export type DrawBroadcastEvent =
  | { type: "stroke"; stroke: DrawStrokeHeader; points: DrawPoint[]; done: boolean }
  | { type: "clear" };

interface DrawStroke extends DrawStrokeHeader {
  points: DrawPoint[];
}

export interface DrawCanvasHandle {
  /** Apply a stroke/clear event received over broadcast. */
  applyRemote: (ev: DrawBroadcastEvent) => void;
  /** Wipe the canvas without broadcasting (round changes). */
  clearAll: () => void;
}

const PALETTE = [
  "#1F2937",
  "#E5484D",
  "#F76B15",
  "#E8A90C",
  "#2FA36B",
  "#3E7BFA",
  "#8E4EC6",
  "#E93D82",
  "#8B5E34",
  "#FFFFFF",
];

const BRUSH_SIZES = [0.006, 0.011, 0.02];
const ERASER_SIZE = 0.035;
const PAPER = "#FFFCF5";
const FLUSH_MS = 50;

export function DrawCanvas({
  editable,
  onLocalEvent,
  ref,
}: {
  /** Only the drawer may draw; guessers get a read-only canvas. */
  editable: boolean;
  /** Fired for local strokes so the parent can broadcast them. */
  onLocalEvent: (ev: DrawBroadcastEvent) => void;
  ref?: Ref<DrawCanvasHandle>;
}) {
  const { t } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<DrawStroke[]>([]);
  const liveRef = useRef<Map<string, DrawStroke>>(new Map());
  const activeIdRef = useRef<string | null>(null);
  const pendingRef = useRef<DrawPoint[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [eraser, setEraser] = useState(false);
  const toolRef = useRef({ color, size: BRUSH_SIZES[1], eraser });
  toolRef.current = { color, size: BRUSH_SIZES[sizeIdx], eraser };

  const cssSize = (): { w: number; h: number } => {
    const el = canvasRef.current;
    return { w: el?.clientWidth ?? 0, h: el?.clientHeight ?? 0 };
  };

  const drawSegment = (stroke: DrawStroke, from: DrawPoint, to: DrawPoint) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h } = cssSize();
    if (w === 0 || h === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = stroke.eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = Math.max(1, stroke.size * w);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x * w, from.y * h);
    ctx.lineTo(to.x * w, to.y * h);
    ctx.stroke();
    // A lone tap (no movement) still leaves a dot.
    if (from.x === to.x && from.y === to.y) {
      ctx.beginPath();
      ctx.arc(from.x * w, from.y * h, Math.max(0.5, (stroke.size * w) / 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (const stroke of strokesRef.current) {
      for (let i = 1; i < stroke.points.length; i++) {
        drawSegment(stroke, stroke.points[i - 1], stroke.points[i]);
      }
      if (stroke.points.length === 1) {
        drawSegment(stroke, stroke.points[0], stroke.points[0]);
      }
    }
  };

  /* Size the backing store for the display size + DPR, then replay. */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAll = () => {
    strokesRef.current = [];
    liveRef.current.clear();
    activeIdRef.current = null;
    pendingRef.current = [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  };

  const applyRemote = (ev: DrawBroadcastEvent) => {
    if (ev.type === "clear") {
      clearAll();
      return;
    }
    let stroke = liveRef.current.get(ev.stroke.id);
    if (!stroke) {
      stroke = { ...ev.stroke, points: [] };
      liveRef.current.set(ev.stroke.id, stroke);
      strokesRef.current.push(stroke);
    }
    for (const pt of ev.points) {
      const prev = stroke.points[stroke.points.length - 1];
      stroke.points.push(pt);
      if (prev) drawSegment(stroke, prev, pt);
      else drawSegment(stroke, pt, pt);
    }
    if (ev.done) liveRef.current.delete(ev.stroke.id);
  };

  useImperativeHandle(ref, () => ({ applyRemote, clearAll }), []);

  /* ------------------------- Local drawing ------------------------- */
  const pointFromEvent = (e: React.PointerEvent): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const flushPending = (done: boolean) => {
    const id = activeIdRef.current;
    const stroke = id ? liveRef.current.get(id) : undefined;
    if (!id || !stroke) return;
    const points = pendingRef.current;
    pendingRef.current = [];
    if (points.length === 0 && !done) return;
    onLocalEvent({
      type: "stroke",
      stroke: { id: stroke.id, color: stroke.color, size: stroke.size, eraser: stroke.eraser },
      points,
      done,
    });
  };

  const stopFlushTimer = () => {
    if (flushTimerRef.current !== null) {
      window.clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  };

  useEffect(() => stopFlushTimer, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!editable) return;
    const pt = pointFromEvent(e);
    if (!pt) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    const tool = toolRef.current;
    const stroke: DrawStroke = {
      id: crypto.randomUUID(),
      color: tool.eraser ? "#000000" : tool.color,
      size: tool.eraser ? ERASER_SIZE : tool.size,
      eraser: tool.eraser,
      points: [pt],
    };
    strokesRef.current.push(stroke);
    liveRef.current.set(stroke.id, stroke);
    activeIdRef.current = stroke.id;
    drawSegment(stroke, pt, pt);
    pendingRef.current = [pt];
    flushPending(false);
    stopFlushTimer();
    flushTimerRef.current = window.setInterval(() => flushPending(false), FLUSH_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!editable) return;
    const id = activeIdRef.current;
    const stroke = id ? liveRef.current.get(id) : undefined;
    if (!stroke) return;
    e.preventDefault();
    const events = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [e.nativeEvent];
    for (const ce of events) {
      const pt = pointFromEvent(ce as unknown as React.PointerEvent);
      if (!pt) continue;
      const prev = stroke.points[stroke.points.length - 1];
      if (prev && prev.x === pt.x && prev.y === pt.y) continue;
      stroke.points.push(pt);
      if (prev) drawSegment(stroke, prev, pt);
      pendingRef.current.push(pt);
    }
  };

  const endStroke = (e: React.PointerEvent) => {
    const id = activeIdRef.current;
    if (!id) return;
    e.preventDefault();
    stopFlushTimer();
    flushPending(true);
    liveRef.current.delete(id);
    activeIdRef.current = null;
    pendingRef.current = [];
  };

  const onClear = () => {
    clearAll();
    onLocalEvent({ type: "clear" });
  };

  const brushLabels = [t.draw.brushSmall, t.draw.brushMedium, t.draw.brushLarge];

  return (
    <div>
      <div
        ref={wrapRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--line)", background: PAPER }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ touchAction: editable ? "none" : "auto", cursor: editable ? "crosshair" : "default" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          aria-label={t.draw.canvasLabel}
        />
      </div>
      {editable && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t.draw.colorsLabel}>
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setEraser(false);
                }}
                aria-pressed={!eraser && color === c}
                aria-label={c}
                className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c,
                  boxShadow:
                    !eraser && color === c
                      ? "0 0 0 2px var(--surface), 0 0 0 4px var(--gold)"
                      : "0 0 0 1px var(--line)",
                }}
              />
            ))}
          </div>
          <span className="mx-1 hidden h-6 w-px sm:block" style={{ background: "var(--line)" }} aria-hidden="true" />
          <div className="flex items-center gap-1.5" role="group" aria-label={t.draw.brushLabel}>
            {BRUSH_SIZES.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSizeIdx(i);
                  setEraser(false);
                }}
                aria-pressed={!eraser && sizeIdx === i}
                aria-label={brushLabels[i]}
                title={brushLabels[i]}
                className="flex h-8 w-8 items-center justify-center rounded-full border"
                style={{
                  borderColor: !eraser && sizeIdx === i ? "var(--gold)" : "var(--line)",
                  background: !eraser && sizeIdx === i ? "var(--surface2)" : "var(--surface)",
                }}
              >
                <span
                  className="rounded-full"
                  style={{ width: 6 + i * 5, height: 6 + i * 5, background: "var(--text)" }}
                  aria-hidden="true"
                />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setEraser((v) => !v)}
              aria-pressed={eraser}
              aria-label={t.draw.eraser}
              title={t.draw.eraser}
              className="flex h-8 w-8 items-center justify-center rounded-full border"
              style={{
                borderColor: eraser ? "var(--gold)" : "var(--line)",
                background: eraser ? "var(--surface2)" : "var(--surface)",
              }}
            >
              <Eraser size={15} aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="btn btn-ghost !px-3 !py-1.5 text-xs" onClick={onClear}>
            <Trash2 size={14} aria-hidden="true" />
            {t.draw.clearCanvas}
          </button>
        </div>
      )}
    </div>
  );
}
