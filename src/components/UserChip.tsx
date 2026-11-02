"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "@/i18n/LanguageContext";

/** Header user chip: shows a 👤 emoji instead of the name.
    Clicking it opens a popup with the user's full info. */
export function UserChip() {
  const { session } = useAuth();
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  if (!session) return null;
  const p = session;

  const rows: Array<[string, string]> = [
    [t.profile.whatsapp, p.whatsapp],
    ...(p.gmail ? [[t.profile.gmail, p.gmail] as [string, string]] : []),
    ...(p.full_name ? [[t.profile.fullName, p.full_name] as [string, string]] : []),
    ...(p.mobile_number ? [[t.profile.mobile, p.mobile_number] as [string, string]] : []),
    ...(p.date_of_birth ? [[t.profile.dob, p.date_of_birth] as [string, string]] : []),
    ...(p.district ? [[t.profile.district, p.district] as [string, string]] : []),
    ...(p.last_education ? [[t.profile.education, p.last_education] as [string, string]] : []),
    ...(p.skills_interests ? [[t.profile.skills, p.skills_interests] as [string, string]] : []),
    ...(p.team_number ? [[t.profile.teamNo, p.team_number] as [string, string]] : []),
    ...(p.gender ? [[t.profile.gender, p.gender] as [string, string]] : []),
    ...(p.blood_group ? [[t.profile.blood, p.blood_group] as [string, string]] : []),
  ];

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="icon-circle"
        style={{ fontSize: 18 }}
        title={t.profile.title}
        aria-label={t.profile.title}
        aria-expanded={open}
      >
        👤
      </button>
      {open && (
        <div
          className="card absolute right-0 top-full z-50 mt-2 max-h-[80vh] w-80 overflow-y-auto p-5"
          role="dialog"
          aria-label={t.profile.title}
        >
          <button
            onClick={() => setOpen(false)}
            className="icon-circle absolute right-3 top-3"
            style={{ width: 28, height: 28 }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">👤</span>
            <div>
              <p className="font-serif-d text-lg font-semibold">{p.name}</p>
              <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>
                {p.role === "super_admin"
                  ? "Super Admin"
                  : lang === "bn"
                    ? p.status === "approved"
                      ? "অনুমোদিত"
                      : p.status === "pending"
                        ? "অপেক্ষমাণ"
                        : "প্রত্যাখ্যাত"
                    : p.status}
              </p>
            </div>
          </div>
          <dl className="mt-4 grid gap-2 text-[13px]">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0" style={{ color: "var(--muted)" }}>
                  {label}
                </dt>
                <dd className="break-all text-right font-medium">{value}</dd>
              </div>
            ))}
            {p.facebook_link && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0" style={{ color: "var(--muted)" }}>
                  {t.profile.fbLink}
                </dt>
                <dd>
                  <a
                    href={p.facebook_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                    style={{ color: "var(--steel-deep)" }}
                  >
                    {lang === "bn" ? "খুলুন ↗" : "Open ↗"}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="btn btn-gold mt-4 flex w-full items-center justify-center gap-1.5 !text-xs"
          >
            <Pencil size={13} /> {t.profile.title}
          </Link>
        </div>
      )}
    </div>
  );
}
