"use client";

import { useState } from "react";

/** Country flag as an image (renders on every device, including Windows where
    flag emojis show as letter codes). Falls back to the emoji if the CDN fails. */
export function CountryFlag({
  code,
  emoji,
  size = 28,
}: {
  code: string;
  emoji: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>;
  }
  const w = Math.round(size * 1.33);
  return (
    <img
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w160/${code.toLowerCase()}.png 2x`}
      alt={code}
      width={w}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: w,
        height: size,
        objectFit: "cover",
        borderRadius: Math.max(3, size * 0.12),
        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    />
  );
}
