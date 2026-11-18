"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Play, RotateCcw, Users } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { SectionHeader } from "@/components/ui";
import LudoGame, { type LudoPlayerMeta, type LudoWinStats } from "@/components/LudoGame";
import {
  applyMove,
  applyRoll,
  CLASSIC_RULES,
  effectiveSafeCells,
  legalMoves,
  resolveRules,
  rollDie,
  type LudoRules,
} from "@/lib/ludo/engine";
import { chooseAiMove } from "@/lib/ludo/ai";
import {
  ANIMATION_TIMINGS,
  DEFAULT_LOCAL_SETTINGS,
  loadLocalSettings,
  saveLocalSettings,
  type AiDifficulty,
  type AnimationSpeed,
  type LudoLocalSettings,
} from "@/lib/ludo/settings";
import {
  autoPlayTurn,
  createLocalController,
  isAiSeat,
  localReducer,
  restoreLocalController,
  tokensHome,
  type LocalAction,
  type LocalControllerState,
} from "@/lib/ludo/local-game";
import {
  LOCAL_SAVE_VERSION,
  clearSavedLocalGame,
  loadSavedLocalGame,
  saveLocalGame,
  type SavedLocalGame,
} from "@/lib/ludo/save";
import { isSoundEnabled, playButtonClick, setSoundEnabled, unlockAudio } from "@/lib/ludo/sounds";

type Humans = 1 | 2 | 3 | 4;

/** Full-row switch: the whole row is the tap target (≥44px), with a
    switch visual on the right. */
function SettingRow({
  label,
  desc,
  checked,
  onToggle,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {desc && (
          <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            {desc}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        style={{
          background: checked ? "var(--gold-deep)" : "var(--surface2)",
          border: "1px solid var(--line)",
        }}
      >
        <span
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
        />
      </span>
    </button>
  );
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function SoloLudoPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();
  const [humans, setHumans] = useState<Humans>(1);
  const [settings, setSettings] = useState<LudoLocalSettings>(DEFAULT_LOCAL_SETTINGS);
  const [controller, setController] = useState<LocalControllerState | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [savedGame, setSavedGame] = useState<SavedLocalGame | null>(null);
  const timersRef = useRef<number[]>([]);
  const controllerRef = useRef<LocalControllerState | null>(null);
  controllerRef.current = controller;
  const finishedAtRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  /* Persisted settings load after mount (no SSR/hydration mismatch).
     The sounds module is the live authority for the sound flag — the
     settings copy is a mirror, synced from it here. */
  useEffect(() => {
    const loaded = loadLocalSettings();
    const merged = { ...loaded, sound: isSoundEnabled() };
    setSettings(merged);
    saveLocalSettings(merged);
  }, []);

  /* Returning to the setup screen: refresh the Resume offer and
     re-sync the sound mirror with the in-game toggle. */
  useEffect(() => {
    if (controller) return;
    setSavedGame(loadSavedLocalGame());
    setSettings((prev) => {
      const on = isSoundEnabled();
      if (prev.sound === on) return prev;
      const next = { ...prev, sound: on };
      saveLocalSettings(next);
      return next;
    });
  }, [controller]);

  /* Freeze the match duration when the game finishes. */
  useEffect(() => {
    if (controller?.game.phase === "finished") {
      if (finishedAtRef.current === null) finishedAtRef.current = Date.now();
    } else {
      finishedAtRef.current = null;
    }
  }, [controller]);

  /* Save the unfinished local game on every state change; clear the
     save when the game finishes. Rooms are unaffected. */
  useEffect(() => {
    if (!controller) return;
    if (controller.game.phase === "finished") {
      clearSavedLocalGame();
      return;
    }
    saveLocalGame({
      version: LOCAL_SAVE_VERSION,
      savedAt: Date.now(),
      game: controller.game,
      humans: controller.humans,
      settings: controller.settings,
      gameKey: controller.gameKey,
      startedAt: controller.startedAt,
      stats: controller.stats,
    });
  }, [controller]);

  const dispatch = useCallback((action: LocalAction) => {
    setController((c) => (c ? localReducer(c, action) : c));
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  /* Roll + settle, spaced by the animation speed. The settle only
     lands when the game is still on the same move — a timeout
     auto-play in between must never receive this stale roll. */
  const dispatchRoll = useCallback(
    (value: number, opts: { gameKey: number; moveNo: number }) => {
      const c = controllerRef.current;
      if (!c || c.gameKey !== opts.gameKey || c.game.move_no !== opts.moveNo) return;
      dispatch({ type: "beginRoll", value });
      setDiceRolling(true);
      const timings = ANIMATION_TIMINGS[c.settings.animationSpeed];
      schedule(() => {
        const now = controllerRef.current;
        if (!now || now.gameKey !== opts.gameKey || now.game.move_no !== opts.moveNo) {
          setDiceRolling(false);
          return;
        }
        dispatch({ type: "settleRoll" });
        setDiceRolling(false);
      }, timings.settleMs);
    },
    [dispatch, schedule],
  );

  /* Move + animation lock release. The lock lifts when the board
     animation finishes (steps × hop + fly-home when a token was
     captured), so input can never land mid-animation. */
  const dispatchMove = useCallback(
    (token: number, opts: { gameKey: number; moveNo: number }) => {
      const c = controllerRef.current;
      if (!c || c.gameKey !== opts.gameKey || c.game.move_no !== opts.moveNo) return;
      const game = c.game;
      if (game.phase !== "move" || game.roll === null) return;
      const timings = ANIMATION_TIMINGS[c.settings.animationSpeed];
      const seat = game.turn;
      const progress = game.players[seat].tokens[token];
      const dest = progress === -1 ? 0 : progress + game.roll;
      const next = applyMove(game, { token });
      const captured =
        next !== game &&
        next.players.some((p, pi) =>
          pi !== seat ? p.tokens.some((tok, ti) => tok === -1 && game.players[pi].tokens[ti] !== -1) : false,
        );
      const duration = (dest - progress) * timings.hopMs + (captured ? timings.flyHomeMs : 0) + 60;
      dispatch({ type: "move", token });
      schedule(() => {
        dispatch({ type: "animationDone" });
      }, duration);
    },
    [dispatch, schedule],
  );

  /* Sweet AI turns: roll after the think delay, then move. The
     effect re-runs after the settle, scheduling the move. Guards
     keep stale timeouts from acting on a newer game state. */
  useEffect(() => {
    const c = controller;
    if (!c || c.game.phase === "finished" || c.rolling || c.animating) return;
    if (!isAiSeat(c, c.game.turn)) return;
    const timings = ANIMATION_TIMINGS[c.settings.animationSpeed];
    const gameKey = c.gameKey;
    const moveNo = c.game.move_no;
    if (c.game.phase === "roll") {
      const actions = autoPlayTurn(c, rollDie);
      const first = actions[0];
      if (!first || first.type !== "beginRoll") return;
      const id = window.setTimeout(() => {
        dispatchRoll(first.value, { gameKey, moveNo });
      }, timings.botRollDelayMs);
      return () => window.clearTimeout(id);
    }
    const actions = autoPlayTurn(c, rollDie);
    const action = actions[0];
    if (!action) return;
    const id = window.setTimeout(() => {
      const now = controllerRef.current;
      if (!now || now.gameKey !== gameKey || now.game.move_no !== moveNo) return;
      if (action.type === "move") {
        dispatchMove(action.token, { gameKey, moveNo });
      } else if (action.type === "pass") {
        dispatch({ type: "pass" });
      }
    }, timings.botMoveDelayMs);
    return () => window.clearTimeout(id);
  }, [controller, dispatch, dispatchMove, dispatchRoll]);

  /* After a human roll with zero legal moves, auto-pass. */
  useEffect(() => {
    const c = controller;
    if (!c || c.game.phase !== "move" || c.rolling || c.animating) return;
    if (isAiSeat(c, c.game.turn)) return;
    if (c.game.roll === null || legalMoves(c.game, c.game.roll).length > 0) return;
    const timings = ANIMATION_TIMINGS[c.settings.animationSpeed];
    const gameKey = c.gameKey;
    const moveNo = c.game.move_no;
    const id = window.setTimeout(() => {
      const now = controllerRef.current;
      if (!now || now.gameKey !== gameKey || now.game.move_no !== moveNo) return;
      dispatch({ type: "pass" });
    }, timings.autoPassMs);
    return () => window.clearTimeout(id);
  }, [controller, dispatch]);

  const handleRoll = useCallback(() => {
    const c = controllerRef.current;
    if (!c || c.game.phase !== "roll" || c.rolling || c.animating) return;
    if (isAiSeat(c, c.game.turn)) return;
    dispatchRoll(rollDie(), { gameKey: c.gameKey, moveNo: c.game.move_no });
  }, [dispatchRoll]);

  const handleToken = useCallback(
    (token: number) => {
      const c = controllerRef.current;
      if (!c || c.game.phase !== "move" || c.rolling || c.animating) return;
      if (isAiSeat(c, c.game.turn)) return;
      dispatchMove(token, { gameKey: c.gameKey, moveNo: c.game.move_no });
    },
    [dispatchMove],
  );

  /* 30s timeout (1P mode only): play the current turn until it
     passes or the game ends, at the chosen AI difficulty. A no-op
     while a roll or animation is in flight — the pending action
     bumps move_no and re-arms the timer. */
  const handleTimeout = useCallback(() => {
    const c = controllerRef.current;
    if (!c || c.game.phase === "finished" || c.rolling || c.animating) return;
    let auto = c.game;
    const stats = c.stats.map((s) => ({ ...s }));
    const startTurn = auto.turn;
    /* 40 steps covers a long extra-turn streak (6/capture/home);
       the loop always ends when the turn passes or the game ends. */
    for (let i = 0; i < 40; i++) {
      if (auto.phase === "finished" || auto.turn !== startTurn) break;
      if (auto.phase === "roll") {
        const value = rollDie();
        if (value === 6) stats[auto.turn].sixes += 1;
        auto = applyRoll(auto, value);
      } else if (auto.phase === "move" && auto.roll !== null) {
        const seat = auto.turn;
        const before = auto.players.map((p) => [...p.tokens]);
        const token = chooseAiMove(auto, auto.roll, c.settings.aiDifficulty);
        auto = applyMove(auto, { token });
        if (token !== null) {
          stats[seat].moves += 1;
          const captured = auto.players.some((p, pi) =>
            pi !== seat ? p.tokens.some((tok, ti) => tok === -1 && before[pi][ti] !== -1) : false,
          );
          if (captured) stats[seat].captures += 1;
        }
      } else {
        break;
      }
    }
    if (auto === c.game) return;
    setController({ ...c, game: auto, stats });
  }, []);

  const updateSettings = useCallback((patch: Partial<LudoLocalSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveLocalSettings(next);
      return next;
    });
  }, []);

  const toggleRule = useCallback(
    (key: keyof LudoRules) => {
      updateSettings({ rules: { ...settings.rules, [key]: !settings.rules[key] } });
    },
    [settings.rules, updateSettings],
  );

  const toggleSound = useCallback(() => {
    const next = !settings.sound;
    setSoundEnabled(next);
    if (next) {
      unlockAudio();
      playButtonClick();
    }
    updateSettings({ sound: next });
  }, [settings.sound, updateSettings]);

  const startGame = useCallback(
    (mode: Humans, useSettings: LudoLocalSettings) => {
      clearTimers();
      setDiceRolling(false);
      setController(createLocalController(mode, useSettings, Date.now(), Date.now()));
    },
    [clearTimers],
  );

  const handlePlayAgain = useCallback(() => {
    const c = controllerRef.current;
    if (!c) return;
    clearTimers();
    setDiceRolling(false);
    setController(createLocalController(c.humans, c.settings, Date.now(), Date.now()));
  }, [clearTimers]);

  const handleExit = useCallback(() => {
    clearTimers();
    setDiceRolling(false);
    setController(null);
  }, [clearTimers]);

  const handleResume = useCallback(() => {
    if (!savedGame) return;
    clearTimers();
    setDiceRolling(false);
    setSettings(savedGame.settings);
    saveLocalSettings(savedGame.settings);
    setController(restoreLocalController(savedGame));
  }, [savedGame, clearTimers]);

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.ludo.loading}
        </p>
      </div>
    );
  }

  if (!controller) {
    const modes: { n: Humans; label: string; desc: string }[] = [
      { n: 1, label: t.ludo.mode1p, desc: t.ludo.mode1pDesc },
      { n: 2, label: t.ludo.mode2p, desc: t.ludo.mode2pDesc },
      { n: 3, label: t.ludo.mode3p, desc: t.ludo.mode3pDesc },
      { n: 4, label: t.ludo.mode4p, desc: t.ludo.mode4pDesc },
    ];
    const ruleRows: { key: keyof LudoRules; label: string; desc: string }[] = [
      { key: "entryOnSix", label: t.ludo.ruleEntryOnSix, desc: t.ludo.ruleEntryOnSixDesc },
      { key: "bonusOnSix", label: t.ludo.ruleBonusOnSix, desc: t.ludo.ruleBonusOnSixDesc },
      { key: "bonusOnCapture", label: t.ludo.ruleBonusOnCapture, desc: t.ludo.ruleBonusOnCaptureDesc },
      { key: "bonusOnHome", label: t.ludo.ruleBonusOnHome, desc: t.ludo.ruleBonusOnHomeDesc },
      { key: "threeSixes", label: t.ludo.ruleThreeSixes, desc: t.ludo.ruleThreeSixesDesc },
      { key: "safeStars", label: t.ludo.ruleSafeStars, desc: t.ludo.ruleSafeStarsDesc },
      { key: "safeStarts", label: t.ludo.ruleSafeStarts, desc: t.ludo.ruleSafeStartsDesc },
      { key: "blockade", label: t.ludo.ruleBlockade, desc: t.ludo.ruleBlockadeDesc },
    ];
    const speeds: { value: AnimationSpeed; label: string }[] = [
      { value: "slow", label: t.ludo.speedSlow },
      { value: "normal", label: t.ludo.speedNormal },
      { value: "fast", label: t.ludo.speedFast },
    ];
    const difficulties: { value: AiDifficulty; label: string; desc: string }[] = [
      { value: "easy", label: t.ludo.diffEasy, desc: t.ludo.diffEasyDesc },
      { value: "medium", label: t.ludo.diffMedium, desc: t.ludo.diffMediumDesc },
      { value: "hard", label: t.ludo.diffHard, desc: t.ludo.diffHardDesc },
    ];
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <SectionHeader title={t.games.ludoTitle} subtitle={t.ludo.modeTitle} />

        {/* Player select */}
        <div className="grid grid-cols-2 gap-2" role="group" aria-label={t.ludo.modeTitle}>
          {modes.map((m) => {
            const selected = humans === m.n;
            return (
              <button
                key={m.n}
                type="button"
                onClick={() => setHumans(m.n)}
                aria-pressed={selected}
                className="rounded-2xl border-2 p-4 text-left transition"
                style={{
                  borderColor: selected ? "var(--gold-deep)" : "var(--line)",
                  background: selected ? "var(--surface2)" : "var(--surface)",
                  boxShadow: selected ? "0 0 0 1px var(--gold-deep)" : undefined,
                }}
              >
                <span className="flex items-center gap-2 text-sm font-bold">
                  {m.n === 1 ? <Bot size={17} aria-hidden="true" /> : <Users size={17} aria-hidden="true" />}
                  {m.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {m.desc}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-gold w-full" onClick={() => startGame(humans, settings)}>
            <Play size={17} aria-hidden="true" />
            {t.ludo.playNow}
          </button>
          {savedGame && (
            <button type="button" className="btn btn-active w-full" onClick={handleResume}>
              <RotateCcw size={17} aria-hidden="true" />
              {t.ludo.resumeGame}
            </button>
          )}
          {savedGame && (
            <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
              {t.ludo.resumeDesc}
            </p>
          )}
        </div>

        {/* How to play */}
        <details className="card p-5">
          <summary className="cursor-pointer text-sm font-semibold">{t.ludo.howToTitle}</summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            <li>{t.ludo.howTo1}</li>
            <li>{t.ludo.howTo2}</li>
            <li>{t.ludo.howTo3}</li>
            <li>{t.ludo.howTo4}</li>
            <li>{t.ludo.howTo5}</li>
          </ol>
        </details>

        {/* Rules & settings */}
        <div className="card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">{t.ludo.settingsTitle}</h2>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.ludo.settingsNote}
          </p>
          <div className="mt-2">
            {ruleRows.map((row) => (
              <SettingRow
                key={row.key}
                label={row.label}
                desc={row.desc}
                checked={settings.rules[row.key]}
                onToggle={() => toggleRule(row.key)}
              />
            ))}
          </div>

          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <SettingRow
              label={t.ludo.soundLabel}
              checked={settings.sound}
              onToggle={toggleSound}
            />
            <p className="mt-3 text-sm font-semibold">{t.ludo.animSpeed}</p>
            <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label={t.ludo.animSpeed}>
              {speeds.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateSettings({ animationSpeed: s.value })}
                  aria-pressed={settings.animationSpeed === s.value}
                  className={`btn ${settings.animationSpeed === s.value ? "btn-active" : "btn-ghost"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {humans === 1 && (
              <>
                <p className="mt-4 text-sm font-semibold">{t.ludo.aiDifficulty}</p>
                <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label={t.ludo.aiDifficulty}>
                  {difficulties.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => updateSettings({ aiDifficulty: d.value })}
                      aria-pressed={settings.aiDifficulty === d.value}
                      className={`btn ${settings.aiDifficulty === d.value ? "btn-active" : "btn-ghost"}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {difficulties.find((d) => d.value === settings.aiDifficulty)?.desc}
                </p>
              </>
            )}
            <button
              type="button"
              className="btn btn-ghost mt-4 w-full"
              onClick={() => updateSettings({ rules: { ...CLASSIC_RULES } })}
            >
              {t.ludo.resetClassic}
            </button>
          </div>
        </div>

        <div>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/games")}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t.games.backToZone}
          </button>
        </div>
      </div>
    );
  }

  const game = controller.game;
  const timings = ANIMATION_TIMINGS[controller.settings.animationSpeed];
  const finished = game.phase === "finished";
  const metas: LudoPlayerMeta[] =
    controller.humans === 1
      ? game.players.map((_, i) =>
          i === 0
            ? { name: session.name, avatar_url: session.avatar_url ?? null, isBot: false, isYou: true }
            : { name: t.ludo.computerName(i), avatar_url: null, isBot: true, isYou: false },
        )
      : game.players.map((_, i) => ({ name: t.ludo.playerName(i + 1), avatar_url: null, isBot: false, isYou: false }));
  const humanTurn = !isAiSeat(controller, game.turn);
  const canRoll = game.phase === "roll" && humanTurn && !controller.rolling && !controller.animating;
  const canMove = game.phase === "move" && humanTurn && !controller.rolling && !controller.animating;
  const movable = canMove && game.roll !== null ? legalMoves(game, game.roll) : [];
  const winStats: LudoWinStats | undefined = finished
    ? {
        rows: game.players.map((p, i) => ({
          name: metas[i].name,
          color: p.color,
          moves: controller.stats[i].moves,
          captures: controller.stats[i].captures,
          sixes: controller.stats[i].sixes,
          home: tokensHome(game, i),
        })),
        durationLabel: formatDuration((finishedAtRef.current ?? Date.now()) - controller.startedAt),
      }
    : undefined;

  return (
    <div className="mx-auto max-w-4xl">
      <LudoGame
        state={game}
        metas={metas}
        canRoll={canRoll}
        canMove={canMove}
        movable={movable}
        diceRolling={diceRolling}
        timerKey={game.move_no}
        timerSeconds={30}
        timerActive={controller.humans === 1 && !finished}
        onRoll={handleRoll}
        onToken={handleToken}
        onTimeout={handleTimeout}
        onPlayAgain={handlePlayAgain}
        onExit={handleExit}
        exitLabel={t.ludo.exitToSetup}
        winIdentity={`solo:${controller.gameKey}`}
        hopMs={timings.hopMs}
        flyHomeMs={timings.flyHomeMs}
        safeCells={effectiveSafeCells(resolveRules(game))}
        localTurn={controller.humans > 1 ? true : undefined}
        postMatchOutcome={controller.humans > 1 ? "win" : undefined}
        showBaseCount
        winStats={winStats}
      />
    </div>
  );
}
