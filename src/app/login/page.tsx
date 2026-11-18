"use client";

import { useState } from "react";
import { CalendarDays, KeyRound, LogIn, UserPlus } from "lucide-react";
import { useAuth, type AuthError } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function LoginPage() {
  const { t, lang } = useLang();
  const { login, register, requestPasswordReset, configured } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError>(null);
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);
  // Forgot-password flow: "forgot" asks for the number, "forgotDone" shows
  // the generated code on screen. Both replace the tabs/form inside the card.
  const [mode, setMode] = useState<"auth" | "forgot" | "forgotDone">("auth");
  const [forgotWa, setForgotWa] = useState("");
  const [forgotError, setForgotError] = useState<AuthError>(null);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [resetCode, setResetCode] = useState<{ code: string; whatsapp: string } | null>(null);

  const errText = (e: AuthError): string => {
    switch (e) {
      case "invalid_whatsapp": return t.auth.errWa;
      case "password_short": return t.auth.errPw;
      case "name_required": return t.auth.errName;
      case "exists": return t.auth.errExists;
      case "no_user": return t.auth.errNoUser;
      case "wrong_password": return t.auth.errWrongPw;
      case "signup_failed": return t.auth.errSignup;
      case "no_approved_account": return t.auth.errNoApproved;
      case "reset_failed": return t.auth.errReset;
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

  const submitForgot = async () => {
    setForgotBusy(true);
    setForgotError(null);
    try {
      const res = await requestPasswordReset(forgotWa);
      if (res.ok) {
        setResetCode({ code: res.code, whatsapp: res.whatsapp });
        setMode("forgotDone");
      } else {
        setForgotError(res.error);
      }
    } finally {
      setForgotBusy(false);
    }
  };

  // Back to the login tab with the number prefilled; the student types the
  // code shown on the previous screen as the password.
  const backFromForgotDone = () => {
    if (resetCode) setWhatsapp(resetCode.whatsapp);
    setPassword("");
    setError(null);
    setTab("login");
    setMode("auth");
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--gold)" }}>
          <CalendarDays size={24} className="gold-contrast-icon" strokeWidth={2.4} />
        </span>
        <h1 className="font-serif-d mt-4 text-[26px] font-semibold tracking-tight">
          Sweet Smart Calendar
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          {mode === "forgot" || mode === "forgotDone"
            ? t.auth.forgotSub
            : tab === "login" ? t.auth.loginSub : t.auth.regSub}
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
        ) : mode === "forgot" ? (
          <>
            <div className="mt-5 grid gap-3">
              <label>
                <span className="label">{t.auth.whatsapp}</span>
                <input
                  className="input mt-1 tabular-nums"
                  placeholder={t.auth.waPh}
                  value={forgotWa}
                  onChange={(e) => setForgotWa(e.target.value)}
                  inputMode="tel"
                  autoComplete="username"
                  onKeyDown={(e) => { if (e.key === "Enter") submitForgot(); }}
                />
              </label>
            </div>

            {forgotError && <p className="auth-error" role="alert">{errText(forgotError)}</p>}

            <button className="btn btn-gold mt-4 w-full" onClick={submitForgot} disabled={forgotBusy}>
              <KeyRound size={15} /> {t.auth.forgotBtn}
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>
              <button
                className="font-semibold underline underline-offset-2"
                style={{ color: "var(--gold-deep)" }}
                onClick={() => { setMode("auth"); setForgotError(null); }}
              >
                {t.auth.backToLogin}
              </button>
            </p>
          </>
        ) : mode === "forgotDone" && resetCode ? (
          <div className="auth-success">
            <p className="font-semibold">{t.auth.forgotCodeT}</p>
            <p
              className="mt-3 text-[40px] font-bold leading-none tracking-[0.25em] tabular-nums"
              style={{ color: "var(--gold-deep)" }}
            >
              {resetCode.code}
            </p>
            <p className="mt-3 text-[13px]" style={{ color: "var(--muted)" }}>{t.auth.forgotCodeH(resetCode.whatsapp)}</p>
            <button className="btn btn-gold mt-4 w-full" onClick={backFromForgotDone}>
              <LogIn size={15} /> {t.auth.backToLogin}
            </button>
            <button
              className="mt-3 text-xs font-semibold underline underline-offset-2"
              style={{ color: "var(--gold-deep)" }}
              onClick={() => { setMode("forgot"); setResetCode(null); setForgotError(null); }}
            >
              {t.auth.forgotRetry}
            </button>
          </div>
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

            {tab === "login" && (
              <button
                className="mt-2 block w-full text-right text-xs font-semibold underline underline-offset-2"
                style={{ color: "var(--gold-deep)" }}
                onClick={() => { setMode("forgot"); setForgotError(null); setForgotWa(whatsapp); }}
              >
                {t.auth.forgotLink}
              </button>
            )}

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
