"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, KeyRound, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { EmptyState, SectionHeader } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import type { Profile } from "@/lib/supabase";

function UserRow({
  user,
  onApprove,
  onReject,
  onRemove,
}: {
  user: Profile;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
}) {
  const { t, lang } = useLang();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const date = new Date(user.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">
          {user.name}
          {user.role === "super_admin" && (
            <span className="chip ml-2 !border-0 !text-[10px] font-bold" style={{ background: "rgba(201,151,31,.16)", color: "var(--gold-deep)" }}>
              <ShieldCheck size={11} /> {t.admin.superAdmin}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs tabular-nums" style={{ color: "var(--muted)" }}>
          {user.whatsapp} · {date}
        </p>
        {(user.gmail || user.team_number || user.gender || user.blood_group || user.full_name || user.mobile_number || user.date_of_birth || user.district || user.last_education || user.skills_interests || user.facebook_link) && (
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: "var(--muted)" }}>
            {user.full_name && (
              <span>{t.profile.fullName}: <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.full_name}</strong></span>
            )}
            {user.gmail && <span className="tabular-nums">{user.gmail}</span>}
            {user.mobile_number && <span className="tabular-nums">📱 {user.mobile_number}</span>}
            {user.date_of_birth && <span>🎂 <span className="tabular-nums">{user.date_of_birth}</span></span>}
            {user.district && (
              <span>📍 <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.district}</strong></span>
            )}
            {user.last_education && (
              <span>🎓 <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.last_education}</strong></span>
            )}
            {user.skills_interests && (
              <span>✨ {user.skills_interests}</span>
            )}
            {user.facebook_link && (
              <a href={user.facebook_link} target="_blank" rel="noopener noreferrer" className="underline">🔗 Facebook</a>
            )}
            {user.team_number && (
              <span>{t.profile.teamNo}: <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.team_number}</strong></span>
            )}
            {user.gender && (
              <span>{t.profile.gender}: <strong className="font-semibold" style={{ color: "var(--ink)" }}>
                {user.gender === "male" ? t.profile.gMale : user.gender === "female" ? t.profile.gFemale : user.gender === "other" ? t.profile.gOther : user.gender}
              </strong></span>
            )}
            {user.blood_group && (
              <span>{t.profile.blood}: <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.blood_group}</strong></span>
            )}
          </p>
        )}
      </div>
      {user.role !== "super_admin" && (
        <div className="flex items-center gap-1.5">
          {user.status === "pending" && (
            <>
              <button className="btn btn-gold !px-3 !py-1.5 !text-xs" onClick={onApprove}>
                <BadgeCheck size={13} /> {t.admin.approve}
              </button>
              <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={onReject}>
                <XCircle size={13} /> {t.admin.reject}
              </button>
            </>
          )}
          {user.status === "approved" && (
            <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={onReject}>
              <XCircle size={13} /> {t.admin.reject}
            </button>
          )}
          {user.status === "rejected" && (
            <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={onApprove}>
              <BadgeCheck size={13} /> {t.admin.approve}
            </button>
          )}
          <button
            className="btn btn-ghost !px-2 !py-1.5"
            title={t.admin.remove}
            aria-label={t.admin.remove}
            style={confirmingRemove ? { border: "1px solid #b3261e", color: "#b3261e" } : undefined}
            onClick={() => {
              if (confirmingRemove) {
                setConfirmingRemove(false);
                onRemove();
              } else {
                setConfirmingRemove(true);
                setTimeout(() => setConfirmingRemove(false), 5000);
              }
            }}
          >
            <Trash2 size={13} />
            {confirmingRemove && (
              <span className="!text-xs font-bold">{t.admin.sure}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { ready, session, users, approve, reject, removeUser, changePassword } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<"ok" | "short" | null>(null);

  useEffect(() => {
    if (ready && session?.role !== "super_admin") router.replace("/");
  }, [ready, session, router]);

  if (!ready || session?.role !== "super_admin") return null;

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  const rejected = users.filter((u) => u.status === "rejected");

  const savePw = async () => {
    if (newPw.length < 6) {
      setPwMsg("short");
      return;
    }
    await changePassword(newPw);
    setNewPw("");
    setPwMsg("ok");
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title={t.admin.title} subtitle={t.admin.sub} />

      {/* Pending approvals */}
      <section>
        <h2 className="font-serif-d mb-3 text-lg font-semibold">
          {t.admin.pendingT} <span className="kanban-count tabular-nums">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <EmptyState title={t.admin.noPendingT} hint={t.admin.noPendingH} />
        ) : (
          <div className="grid gap-2.5">
            {pending.map((u) => (
              <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section>
        <h2 className="font-serif-d mb-3 text-lg font-semibold">
          {t.admin.approvedT} <span className="kanban-count tabular-nums">{approved.length}</span>
        </h2>
        <div className="grid gap-2.5">
          {approved.map((u) => (
            <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} />
          ))}
        </div>
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <h2 className="font-serif-d mb-3 text-lg font-semibold">
            {t.admin.rejectedT} <span className="kanban-count tabular-nums">{rejected.length}</span>
          </h2>
          <div className="grid gap-2.5">
            {rejected.map((u) => (
              <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Change admin password */}
      <section className="card p-5">
        <h2 className="font-serif-d mb-1 text-lg font-semibold">{t.admin.pwT}</h2>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>{t.admin.pwH}</p>
        <div className="flex max-w-md flex-wrap items-center gap-2">
          <input
            type="password"
            className="input flex-1"
            placeholder={t.admin.pwPh}
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); setPwMsg(null); }}
            autoComplete="new-password"
          />
          <button className="btn btn-gold" onClick={savePw}>
            <KeyRound size={14} /> {t.admin.pwBtn}
          </button>
        </div>
        {pwMsg === "ok" && <p className="mt-2 text-sm font-semibold" style={{ color: "#2F9E6E" }}>{t.admin.pwOk}</p>}
        {pwMsg === "short" && <p className="mt-2 text-sm font-semibold" style={{ color: "#C0524D" }}>{t.auth.errPw}</p>}
      </section>
    </div>
  );
}
