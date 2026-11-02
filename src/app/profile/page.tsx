"use client";

/* My Profile: the logged-in user views and edits their own basic info.
   Name + WhatsApp are read-only; gmail / team number / gender / blood group
   are editable and visible to the super admin in /admin. */

import { useEffect, useState } from "react";
import { CheckCircle2, Lock, Save, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { SectionHeader } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";

const GENDERS = ["male", "female", "other"] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

export default function ProfilePage() {
  const { ready, session, updateProfile } = useAuth();
  const { t } = useLang();
  const [gmail, setGmail] = useState("");
  const [teamNo, setTeamNo] = useState("");
  const [gender, setGender] = useState("");
  const [blood, setBlood] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [district, setDistrict] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [fbLink, setFbLink] = useState("");
  const [msg, setMsg] = useState<"ok" | "not_ready" | "error" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setGmail(session.gmail ?? "");
      setTeamNo(session.team_number ?? "");
      setGender(session.gender ?? "");
      setBlood(session.blood_group ?? "");
      setFullName(session.full_name ?? "");
      setMobile(session.mobile_number ?? "");
      setDob(session.date_of_birth ?? "");
      setDistrict(session.district ?? "");
      setEducation(session.last_education ?? "");
      setSkills(session.skills_interests ?? "");
      setFbLink(session.facebook_link ?? "");
    }
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  if (!session) return null;

  const genderLabel = (g: string) =>
    g === "male" ? t.profile.gMale : g === "female" ? t.profile.gFemale : g === "other" ? t.profile.gOther : g;

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const res = await updateProfile({
      gmail,
      team_number: teamNo,
      gender,
      blood_group: blood,
      full_name: fullName,
      mobile_number: mobile,
      date_of_birth: dob,
      district,
      last_education: education,
      skills_interests: skills,
      facebook_link: fbLink,
    });
    setMsg(res === "ok" ? "ok" : res);
    setSaving(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <SectionHeader title={t.profile.title} subtitle={t.profile.sub} />

      <div className="card p-5 sm:p-6">
        {/* Identity (read-only) */}
        <div className="flex items-center gap-4">
          <span
            className="font-serif-d flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ background: "var(--gold)" }}
          >
            {session.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-serif-d truncate text-xl font-semibold">{session.name}</p>
            <p className="mt-0.5 text-sm tabular-nums" style={{ color: "var(--muted)" }}>
              {session.whatsapp}
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
          <Lock size={12} /> {t.profile.lockedNote}
        </p>

        <div className="my-5 h-px" style={{ background: "var(--line)" }} />

        {/* Editable fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="label">{t.profile.fullName}</span>
            <input
              className="input mt-1"
              placeholder={t.profile.fullNamePh}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label>
            <span className="label">{t.profile.mobile}</span>
            <input
              type="tel"
              className="input mt-1"
              placeholder={t.profile.mobilePh}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              autoComplete="tel"
            />
          </label>
          <label>
            <span className="label">{t.profile.dob}</span>
            <input
              type="date"
              className="input mt-1"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </label>
          <label>
            <span className="label">{t.profile.district}</span>
            <input
              className="input mt-1"
              placeholder={t.profile.districtPh}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </label>
          <label>
            <span className="label">{t.profile.education}</span>
            <input
              className="input mt-1"
              placeholder={t.profile.educationPh}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label">{t.profile.gmail}</span>
            <input
              type="email"
              className="input mt-1"
              placeholder={t.profile.gmailPh}
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label">{t.profile.skills}</span>
            <textarea
              className="input mt-1 min-h-[84px] resize-y"
              placeholder={t.profile.skillsPh}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label">{t.profile.fbLink} <span style={{ color: "var(--muted)" }}>({t.profile.optional})</span></span>
            <input
              type="url"
              className="input mt-1"
              placeholder={t.profile.fbLinkPh}
              value={fbLink}
              onChange={(e) => setFbLink(e.target.value)}
              autoComplete="url"
            />
          </label>
          <label>
            <span className="label">{t.profile.teamNo}</span>
            <input
              className="input mt-1"
              placeholder={t.profile.teamNoPh}
              value={teamNo}
              onChange={(e) => setTeamNo(e.target.value)}
            />
          </label>
          <label>
            <span className="label">{t.profile.gender}</span>
            <select className="input mt-1" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{t.profile.gSelect}</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{genderLabel(g)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">{t.profile.blood}</span>
            <select className="input mt-1" value={blood} onChange={(e) => setBlood(e.target.value)}>
              <option value="">{t.profile.gSelect}</option>
              {BLOOD_GROUPS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className="btn btn-gold" onClick={save} disabled={saving}>
            <Save size={14} /> {t.profile.save}
          </button>
          {msg === "ok" && (
            <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#2F9E6E" }}>
              <CheckCircle2 size={15} /> {t.profile.saved}
            </p>
          )}
          {msg === "not_ready" && (
            <p className="text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>{t.profile.notReady}</p>
          )}
          {msg === "error" && (
            <p className="text-sm font-semibold" style={{ color: "#C0524D" }}>{t.profile.err}</p>
          )}
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
        <UserRound size={12} /> {t.profile.sub}
      </p>
    </div>
  );
}
