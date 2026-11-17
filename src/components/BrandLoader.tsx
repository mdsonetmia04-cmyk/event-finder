/** Brand moment shown while the site loads: gold spinner, wordmark,
 *  and the loading line (Bengali primary, English secondary).
 *  Theme-aware via the site's CSS variables. */
export default function BrandLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="loader" aria-hidden="true" />
      <p
        className="font-serif-d text-xl font-semibold tracking-tight"
        style={{ color: "var(--text)" }}
      >
        Sweet Smart Calendar
      </p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        আপনার ক্যালেন্ডার এখন আপনার মতোই স্মার্ট হচ্ছে…
      </p>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Your calendar is getting as smart as you are…
      </p>
    </div>
  );
}
