"use client";

import { useState } from "react";
import { CalendarDays, LogIn, UserPlus } from "lucide-react";
import { useAuth, type AuthError } from "@/components/AuthContext";
import { lastAuthDebug } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function LoginPage() {
  const { t, lang } = useLang();
  const { login, register, configured } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError>(null);
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);

  const errText = (e: AuthError): string => {
    switch (e) {
      case "invalid_whatsapp": return t.auth.errWa;
      case "password_short": return t.auth.errPw;
      case "name_required": return t.auth.errName;
      case "exists": return t.auth.errExists;
      case "no_user": return t.auth.errNoUser;
      case "wrong_password": return t.auth.errWrongPw;
      case "signup_failed": return `${t.auth.errSignup}${lastAuthDebug ? ` [${lastAuthDebug}]` : ""}`; // DEBUG-REG
      case "not_configured": return t.auth.notConfigured;
      default: return "";
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (tab === "login") {
        const err = await login(whatsapp, password);
        setError(err);
      } else {
        const err = await register(name, whatsapp, password);
        if (!err) {
          setRegistered(true);
          setName("");
          setWhatsapp("");
          setPassword("");
        } else {
          setError(err);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--gold)" }}>
          <CalendarDays size={24} color="#1a1405" strokeWidth={2.4} />
        </span>
        <h1 className="font-serif-d mt-4 text-[26px] font-semibold tracking-tight">
          Sweet Smart Calendar
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          {tab === "login" ? t.auth.loginSub : t.auth.regSub}
        </p>

        {registered ? (
          <div className="auth-success">
            <p className="font-semibold">{t.auth.regDoneT}</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>{t.auth.regDoneH}</p>
            <button className="btn btn-gold mt-4 w-full" onClick={() => { setRegistered(false); setTab("login"); }}>
              <LogIn size={15} /> {t.auth.backToLogin}
            </button>
          </div>
        ) : !configured ? (
          <p className="auth-error" role="alert">{t.auth.notConfigured}</p>
        ) : (
          <>
            <div className="auth-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={tab === "login"}
                className={tab === "login" ? "auth-tab-active" : ""}
                onClick={() => { setTab("login"); setError(null); }}
              >
                <LogIn size={14} /> {t.auth.loginTab}
              </button>
              <button
                role="tab"
                aria-selected={tab === "register"}
                className={tab === "register" ? "auth-tab-active" : ""}
                onClick={() => { setTab("register"); setError(null); }}
              >
                <UserPlus size={14} /> {t.auth.regTab}
              </button>
            </div>

            <div className="grid gap-3">
              {tab === "register" && (
                <label>
                  <span className="label">{t.auth.name}</span>
                  <input
                    className="input mt-1"
                    placeholder={t.auth.namePh}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </label>
              )}
              <label>
                <span className="label">{t.auth.whatsapp}</span>
                <input
                  className="input mt-1 tabular-nums"
                  placeholder={t.auth.waPh}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  inputMode="tel"
                  autoComplete={tab === "login" ? "username" : "tel"}
                />
              </label>
              <label>
                <span className="label">{t.auth.password}</span>
                <input
                  type="password"
                  className="input mt-1"
                  placeholder={t.auth.pwPh}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                />
              </label>
            </div>

            {error && <p className="auth-error" role="alert">{errText(error)}</p>}

            <button className="btn btn-gold mt-4 w-full" onClick={submit} disabled={busy}>
              {tab === "login" ? <><LogIn size={15} /> {t.auth.loginBtn}</> : <><UserPlus size={15} /> {t.auth.regBtn}</>}
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>
              {tab === "login" ? t.auth.regNote : t.auth.loginNote}{" "}
              <button
                className="font-semibold underline underline-offset-2"
                style={{ color: "var(--gold-deep)" }}
                onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(null); }}
              >
                {tab === "login" ? t.auth.regTab : t.auth.loginTab}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
