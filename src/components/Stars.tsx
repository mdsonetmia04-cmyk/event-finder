"use client";

/** 5-star sales-potential rating: ★★★★★ (gold filled) + ☆☆☆☆☆ (muted). */
export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      className="inline-flex items-center gap-[1px]"
      role="img"
      aria-label={`${v} out of 5 stars`}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{ color: i < v ? "var(--gold-deep)" : "var(--line)" }}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}
