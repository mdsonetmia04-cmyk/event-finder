"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  BookOpenText,
  Check,
  Clock,
  Flame,
  Lightbulb,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { SectionHeader } from "@/components/ui";
import {
  correctWordDisplayIndex,
  drawWordQuestions,
  wordOptions,
  type WordBattleQuestion,
  type WordLevel,
} from "@/lib/words/bank";
import { planBotAnswer, type BotPlan } from "@/lib/quiz/adobe-stock-questions";
import {
  isSoundEnabled,
  playButtonClick,
  playCapture,
  playTokenHome,
  playWinFanfare,
  setSoundEnabled,
  unlockAudio,
} from "@/lib/ludo/sounds";
import { ADOBE_STOCK_NUDGE, NUDGE_AFTER_WINS, pickPostMatchLine, recordWin } from "@/lib/games/win-motivation";
import WordMultiplayer from "./multiplayer";

const QUESTION_COUNT = 10;
const QUESTION_MS = 15000;
const REVEAL_MS = 8000;

const GREEN = "#2FA36B";
const RED = "#E5484D";

type Phase = "setup" | "playing" | "reveal" | "results";
type LevelChoice = "all" | WordLevel;

interface RoundRecord {
  number: number;
  bq: WordBattleQuestion;
  playerPick: number | null;
  botPick: number;
  playerCorrect: boolean;
  botCorrect: boolean;
}

interface RoundResult {
  playerPick: number | null;
  botPick: number;
  timedOut: boolean;
  playerCorrect: boolean;
  botCorrect: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function WordBattlePage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("setup");
  const [battle, setBattle] = useState<WordBattleQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(QUESTION_MS);
  const [botAnswered, setBotAnswered] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [playerStreak, setPlayerStreak] = useState(0);
  const [botStreak, setBotStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [review, setReview] = useState<RoundRecord[]>([]);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  /** Adobe Stock nudge: shown from the 3rd session win onward. */
  const [showNudge, setShowNudge] = useState(false);
  /** Setup mode: Quick Battle vs Sweet AI, or Multiplayer rooms. */
  const [mode, setMode] = useState<"quick" | "multiplayer">("quick");
  /** Solo level picker: all levels, or one level only. */
  const [level, setLevel] = useState<LevelChoice>("all");

  /* Refs mirror the values timers need, so callbacks never read stale state. */
  const phaseRef = useRef<Phase>("setup");
  const battleRef = useRef<WordBattleQuestion[]>([]);
  const qIndexRef = useRef(0);
  const scoreRef = useRef({ player: 0, bot: 0 });
  const streakRef = useRef({ player: 0, bot: 0 });
  const roundRef = useRef<{ bq: WordBattleQuestion; bot: BotPlan; correctIndex: number } | null>(null);
  const deadlineRef = useRef(0);
  const timeLeftRef = useRef(QUESTION_MS);
  const intervalRef = useRef<number | null>(null);
  const botTimeoutRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  /** Bumps on every startBattle so each battle is a distinct win. */
  const battleIdRef = useRef(0);
  const levelRef = useRef<LevelChoice>("all");

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    if (botTimeoutRef.current !== null) window.clearTimeout(botTimeoutRef.current);
    if (revealTimeoutRef.current !== null) window.clearTimeout(revealTimeoutRef.current);
    intervalRef.current = null;
    botTimeoutRef.current = null;
    revealTimeoutRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) unlockAudio();
      return next;
    });
  }, []);

  const startQuestion = useCallback(
    (index: number, questions: WordBattleQuestion[]) => {
      const bq = questions[index];
      const correctIndex = correctWordDisplayIndex(bq);
      roundRef.current = { bq, bot: planBotAnswer(correctIndex), correctIndex };
      qIndexRef.current = index;
      setQIndex(index);
      setRoundResult(null);
      setBotAnswered(false);
      timeLeftRef.current = QUESTION_MS;
      setTimeLeftMs(QUESTION_MS);
      deadlineRef.current = Date.now() + QUESTION_MS;
      phaseRef.current = "playing";
      setPhase("playing");

      intervalRef.current = window.setInterval(() => {
        const remaining = deadlineRef.current - Date.now();
        if (remaining <= 0) {
          timeLeftRef.current = 0;
          setTimeLeftMs(0);
          revealRef.current(null);
        } else {
          timeLeftRef.current = remaining;
          setTimeLeftMs(remaining);
        }
      }, 100);

      botTimeoutRef.current = window.setTimeout(() => {
        setBotAnswered(true);
      }, roundRef.current.bot.delayMs);
    },
    [],
  );

  /* revealRef holds the reveal function so the interval (created in
     startQuestion) always calls the latest logic without stale closures. */
  const revealRef = useRef<(pick: number | null) => void>(() => {});

  const advance = useCallback(
    (opts?: { silent?: boolean }) => {
      if (phaseRef.current !== "reveal") return;
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }
      if (!opts?.silent) playButtonClick();
      if (qIndexRef.current >= battleRef.current.length - 1) {
        phaseRef.current = "results";
        setPhase("results");
        if (scoreRef.current.player > scoreRef.current.bot) {
          playWinFanfare();
          /* Count-once win identity: battle instance. Wins only —
             a loss or tie never counts and never shows the nudge. */
          const { count } = recordWin("word-battle", `word-battle:${battleIdRef.current}`);
          setShowNudge(count >= NUDGE_AFTER_WINS);
        }
        return;
      }
      startQuestion(qIndexRef.current + 1, battleRef.current);
    },
    [startQuestion],
  );

  const reveal = useCallback(
    (pick: number | null) => {
      if (phaseRef.current !== "playing") return;
      const round = roundRef.current;
      if (!round) return;
      clearTimers();

      const playerCorrect = pick !== null && pick === round.correctIndex;
      const playerStreakAfter = playerCorrect ? streakRef.current.player + 1 : 0;
      const botCorrect = round.bot.answerIndex === round.correctIndex;
      const botStreakAfter = botCorrect ? streakRef.current.bot + 1 : 0;

      streakRef.current = { player: playerStreakAfter, bot: botStreakAfter };
      scoreRef.current = {
        player: scoreRef.current.player + (playerCorrect ? 1 : 0),
        bot: scoreRef.current.bot + (botCorrect ? 1 : 0),
      };
      setPlayerStreak(playerStreakAfter);
      setBotStreak(botStreakAfter);
      setBestStreak((prev) => Math.max(prev, playerStreakAfter));
      if (playerCorrect) setCorrectCount((c) => c + 1);
      setPlayerScore(scoreRef.current.player);
      setBotScore(scoreRef.current.bot);
      setReview((prev) => [
        ...prev,
        {
          number: qIndexRef.current + 1,
          bq: round.bq,
          playerPick: pick,
          botPick: round.bot.answerIndex,
          playerCorrect,
          botCorrect,
        },
      ]);
      setRoundResult({
        playerPick: pick,
        botPick: round.bot.answerIndex,
        timedOut: pick === null,
        playerCorrect,
        botCorrect,
      });
      if (playerCorrect) playTokenHome();
      else playCapture();

      phaseRef.current = "reveal";
      setPhase("reveal");
      revealTimeoutRef.current = window.setTimeout(() => {
        advanceRef.current({ silent: true });
      }, REVEAL_MS);
    },
    [clearTimers],
  );

  /* advanceRef mirrors advance for the auto-advance timeout. */
  const advanceRef = useRef<(opts?: { silent?: boolean }) => void>(() => {});
  advanceRef.current = advance;
  revealRef.current = reveal;

  const startBattle = useCallback(() => {
    unlockAudio();
    playButtonClick();
    clearTimers();
    battleIdRef.current += 1;
    setShowNudge(false);
    const questions = drawWordQuestions(
      QUESTION_COUNT,
      levelRef.current === "all" ? undefined : levelRef.current,
    );
    battleRef.current = questions;
    scoreRef.current = { player: 0, bot: 0 };
    streakRef.current = { player: 0, bot: 0 };
    setBattle(questions);
    setPlayerScore(0);
    setBotScore(0);
    setPlayerStreak(0);
    setBotStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setReview([]);
    startQuestion(0, questions);
  }, [clearTimers, startQuestion]);

  const answer = useCallback(
    (displayIndex: number) => {
      if (phaseRef.current !== "playing") return;
      playButtonClick();
      reveal(displayIndex);
    },
    [reveal],
  );

  const pickLevel = useCallback((choice: LevelChoice) => {
    levelRef.current = choice;
    setLevel(choice);
  }, []);

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.ludo.loading}
        </p>
      </div>
    );
  }

  const isQuickMode = mode === "quick";
  const isMultiplayerMode = mode === "multiplayer";

  if (mode === "multiplayer") {
    return <WordMultiplayer onExit={() => setMode("quick")} />;
  }

  const current = battle[qIndex];
  const isLast = qIndex >= battle.length - 1;
  const secondsLeft = Math.ceil(timeLeftMs / 1000);
  const timerPct = Math.max(0, Math.min(100, (timeLeftMs / QUESTION_MS) * 100));
  const lowTime = phase === "playing" && timeLeftMs <= 5000;
  const maxScore = Math.max(playerScore, botScore, 1);

  /* ------------------------------- Setup ------------------------------- */
  if (phase === "setup") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <SectionHeader
          title={t.word.title}
          subtitle={t.word.setupSub}
          action={
            <button
              type="button"
              className="btn btn-ghost"
              onClick={toggleSound}
              aria-label={soundOn ? t.ludo.soundOff : t.ludo.soundOn}
            >
              {soundOn ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
              {soundOn ? t.ludo.soundOn : t.ludo.soundOff}
            </button>
          }
        />
        <div>
          <p className="text-sm font-semibold">{t.word.levels.modeTitle}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="card !p-4 text-left"
              onClick={() => setMode("quick")}
              aria-pressed={isQuickMode}
              style={isQuickMode ? { borderColor: "var(--gold)" } : undefined}
            >
              <p className="text-sm font-semibold">{t.word.levels.modeQuick}</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {t.word.levels.modeQuickDesc}
              </p>
            </button>
            <button
              type="button"
              className="card !p-4 text-left"
              onClick={() => setMode("multiplayer")}
              aria-pressed={isMultiplayerMode}
              style={isMultiplayerMode ? { borderColor: "var(--gold)" } : undefined}
            >
              <p className="text-sm font-semibold">{t.word.levels.modeMultiplayer}</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {t.word.levels.modeMultiplayerDesc}
              </p>
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">{t.word.levels.levelTitle}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["all", t.word.levels.levelAll],
                ["basic", t.word.levels.levelBasic],
                ["intermediate", t.word.levels.levelIntermediate],
                ["advanced", t.word.levels.levelAdvanced],
              ] as [LevelChoice, string][]
            ).map(([choice, label]) => (
              <button
                key={choice}
                type="button"
                className="card !p-3 text-center text-sm font-semibold"
                onClick={() => pickLevel(choice)}
                aria-pressed={level === choice}
                style={level === choice ? { borderColor: "var(--gold)" } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-5 sm:p-6">
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.word.setupDesc}
          </p>
          <p className="mt-5 text-sm font-semibold">{t.word.howTitle}</p>
          <ul className="mt-3 flex flex-col gap-3 text-sm leading-relaxed">
            <li className="flex items-start gap-2.5">
              <Zap size={17} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.word.ruleQuestions}
            </li>
            <li className="flex items-start gap-2.5">
              <Clock size={17} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.word.ruleTimer}
            </li>
            <li className="flex items-start gap-2.5">
              <Bot size={17} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.word.ruleBot}
            </li>
            <li className="flex items-start gap-2.5">
              <Flame size={17} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.word.ruleScoring}
            </li>
          </ul>
          <button type="button" className="btn btn-gold mt-6 w-full" onClick={startBattle}>
            <Play size={17} aria-hidden="true" />
            {t.word.startBattle}
          </button>
          <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>
            {t.word.newBattleNote}
          </p>
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

  /* ------------------------------ Results ------------------------------ */
  if (phase === "results") {
    const won = playerScore > botScore;
    const draw = playerScore === botScore;
    const wrongFirst = [...review].sort((a, b) => Number(a.playerCorrect) - Number(b.playerCorrect));
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <SectionHeader title={t.word.resultsTitle} subtitle={t.word.finalScore} />
        <div className="card p-5 text-center sm:p-6">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white"
            style={{ background: won ? GREEN : "var(--gold)" }}
          >
            <Trophy size={26} aria-hidden="true" />
          </span>
          <h2 className="font-serif-d mt-3 text-2xl font-semibold">
            {draw ? t.word.draw : won ? t.word.youWin : t.word.botWins}
          </h2>
          <p className="mt-2 text-base font-bold" style={{ color: "var(--gold-deep)" }}>
            {pickPostMatchLine(won || draw ? "win" : "loss", `word-battle:${battleIdRef.current}`)}
          </p>
          {won && showNudge && (
            <p
              className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--surface2)", color: "var(--gold-deep)" }}
            >
              {ADOBE_STOCK_NUDGE}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ background: "var(--surface2)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {session.name}
              </p>
              <p className="font-serif-d text-4xl font-bold tabular-nums">{playerScore}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface2)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t.word.computer}
              </p>
              <p className="font-serif-d text-4xl font-bold tabular-nums">{botScore}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="chip">{t.word.correctCount(correctCount, battle.length)}</span>
            <span className="chip">
              <Flame size={13} aria-hidden="true" />
              {t.word.bestStreak(bestStreak)}
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="btn btn-gold flex-1" onClick={startBattle}>
              <RotateCcw size={16} aria-hidden="true" />
              {t.ludo.playAgain}
            </button>
            <button type="button" className="btn btn-ghost flex-1" onClick={() => router.push("/games")}>
              <ArrowLeft size={16} aria-hidden="true" />
              {t.games.backToZone}
            </button>
          </div>
        </div>

        <section>
          <h2 className="font-serif-d text-lg font-semibold">{t.word.reviewTitle}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t.word.reviewHint}
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {wrongFirst.map((rec) => {
              const opts = wordOptions(rec.bq);
              const correctIdx = correctWordDisplayIndex(rec.bq);
              const entry = rec.bq.entry;
              return (
                <article
                  key={entry.id}
                  className="card p-4"
                  style={rec.playerCorrect ? undefined : { borderColor: RED }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold leading-relaxed">
                      {t.word.questionOf(rec.number, battle.length)} — {entry.word}
                    </p>
                    {rec.playerCorrect ? (
                      <Check size={18} className="shrink-0" style={{ color: GREEN }} aria-hidden="true" />
                    ) : (
                      <X size={18} className="shrink-0" style={{ color: RED }} aria-hidden="true" />
                    )}
                  </div>
                  <p className="mt-2 text-sm">
                    <span style={{ color: "var(--muted)" }}>{t.word.yourAnswer}: </span>
                    <span style={{ color: rec.playerCorrect ? GREEN : RED, fontWeight: 600 }}>
                      {rec.playerPick === null ? t.word.noAnswer : opts[rec.playerPick]}
                    </span>
                  </p>
                  {!rec.playerCorrect && (
                    <p className="mt-1 text-sm">
                      <span style={{ color: "var(--muted)" }}>{t.word.correctAnswer}: </span>
                      <span style={{ color: GREEN, fontWeight: 600 }}>{opts[correctIdx]}</span>
                    </p>
                  )}
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    <Bot size={13} className="mr-1 inline" aria-hidden="true" />
                    {t.word.botAnswer}: {opts[rec.botPick]}
                    {rec.botCorrect ? " ✓" : " ✗"}
                  </p>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
                    {entry.example}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  /* --------------------------- Playing / reveal --------------------------- */
  if (!current) return null;
  const entry = current.entry;
  const options = wordOptions(current);
  const correctIdx = correctWordDisplayIndex(current);
  const revealing = phase === "reveal";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {/* Score race */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--muted)" }}>
          <span>{t.word.questionOf(qIndex + 1, battle.length)}</span>
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1"
            onClick={toggleSound}
            aria-label={soundOn ? t.ludo.soundOff : t.ludo.soundOn}
          >
            {soundOn ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-sm font-semibold">{session.name}</span>
            <div className="progress flex-1">
              <div style={{ width: `${(playerScore / maxScore) * 100}%`, background: "var(--gold)" }} />
            </div>
            <span className="w-12 text-right text-sm font-bold tabular-nums">{playerScore}</span>
            {playerStreak >= 2 && (
              <span className="chip !py-0.5 text-[11px]" style={{ color: "var(--gold-deep)" }}>
                <Flame size={12} aria-hidden="true" />
                {playerStreak}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-sm font-semibold">
              <Bot size={14} className="mr-1 inline" aria-hidden="true" />
              {t.word.computer}
            </span>
            <div className="progress flex-1">
              <div style={{ width: `${(botScore / maxScore) * 100}%`, background: "#3E7BFA" }} />
            </div>
            <span className="w-12 text-right text-sm font-bold tabular-nums">{botScore}</span>
            {botStreak >= 2 && (
              <span className="chip !py-0.5 text-[11px]" style={{ color: "#3E7BFA" }}>
                <Flame size={12} aria-hidden="true" />
                {botStreak}
              </span>
            )}
          </div>
        </div>
        {/* Question progress dots */}
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {battle.map((bq, i) => (
            <span
              key={bq.entry.id}
              className="h-1.5 flex-1 rounded-full"
              style={{
                background:
                  i < qIndex
                    ? review[i]?.playerCorrect
                      ? GREEN
                      : RED
                    : i === qIndex
                      ? "var(--gold)"
                      : "var(--line)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="chip">
            <BookOpenText size={13} className="mr-1 inline" aria-hidden="true" />
            {t.word.levels[
              entry.level === "basic"
                ? "levelBasic"
                : entry.level === "intermediate"
                  ? "levelIntermediate"
                  : "levelAdvanced"
            ]}
          </span>
          <span
            className="flex items-center gap-1.5 text-sm font-bold tabular-nums"
            style={{ color: lowTime ? RED : "var(--muted)" }}
            aria-label={t.word.timeLeft}
          >
            <Clock size={15} aria-hidden="true" />
            {revealing ? "0" : secondsLeft}s
          </span>
        </div>
        <div className="progress mt-3" aria-hidden="true">
          <div
            style={{
              width: `${revealing ? 0 : timerPct}%`,
              background: lowTime ? RED : "var(--gold)",
              transition: "width 100ms linear",
            }}
          />
        </div>

        <h2 className="font-serif-d mt-4 text-center text-3xl font-bold leading-snug">{entry.word}</h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--muted)" }}>
          {t.word.meaningPrompt}
        </p>
        <p className="mt-3 text-center text-sm italic leading-relaxed" style={{ color: "var(--muted)" }}>
          &ldquo;{entry.example}&rdquo;
        </p>

        <div className="mt-4 flex flex-col gap-2" role="group">
          {options.map((opt, i) => {
            const isCorrect = i === correctIdx;
            const isPlayerPick = roundResult?.playerPick === i;
            const showState = revealing && roundResult !== null;
            const isBotPick = showState && roundResult.botPick === i;
            const borderColor = showState
              ? isCorrect
                ? GREEN
                : isPlayerPick
                  ? RED
                  : "var(--line)"
              : "var(--line)";
            const bg = showState
              ? isCorrect
                ? "color-mix(in srgb, #2FA36B 12%, transparent)"
                : isPlayerPick
                  ? "color-mix(in srgb, #E5484D 10%, transparent)"
                  : "transparent"
              : "transparent";
            return (
              <button
                key={i}
                type="button"
                disabled={revealing}
                onClick={() => answer(i)}
                className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors sm:px-4"
                style={{ borderColor: borderColor, background: bg }}
                aria-pressed={isPlayerPick}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: showState && isCorrect ? GREEN : "var(--surface2)",
                    color: showState && isCorrect ? "#fff" : "inherit",
                  }}
                >
                  {showState && isCorrect ? (
                    <Check size={15} aria-hidden="true" />
                  ) : showState && isPlayerPick ? (
                    <X size={15} aria-hidden="true" />
                  ) : (
                    OPTION_LETTERS[i]
                  )}
                </span>
                <span className="min-w-0 flex-1 leading-relaxed">{opt}</span>
                {showState && isPlayerPick && (
                  <span className="chip shrink-0 !py-0.5 text-[11px]">{t.word.yourAnswer}</span>
                )}
                {showState && isBotPick && (
                  <span className="chip shrink-0 !py-0.5 text-[11px]">
                    <Bot size={12} aria-hidden="true" />
                    {t.word.computer}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bot status while playing */}
        {!revealing && (
          <p className="mt-4 flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <Bot size={16} aria-hidden="true" />
            {botAnswered ? (
              t.word.botAnswered
            ) : (
              <>
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ background: "var(--gold)" }} aria-hidden="true" />
                {t.word.botThinking}
              </>
            )}
          </p>
        )}

        {/* Reveal panel — learn from mistakes: correct meaning + example. */}
        {revealing && roundResult && (
          <div className="mt-4">
            <p className="text-base font-semibold" style={{ color: roundResult.playerCorrect ? GREEN : RED }}>
              {roundResult.timedOut
                ? t.word.timeUp
                : roundResult.playerCorrect
                  ? t.word.correct
                  : t.word.wrong}
              {roundResult.timedOut && !roundResult.playerCorrect && (
                <span className="ml-2 text-sm font-normal" style={{ color: "var(--muted)" }}>
                  {t.word.unanswered}
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              <span style={{ color: "var(--muted)" }}>{t.word.correctAnswer}: </span>
              <span style={{ color: GREEN, fontWeight: 700 }}>{options[correctIdx]}</span>
            </p>
            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              &ldquo;{entry.example}&rdquo;
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl p-3" style={{ background: "var(--surface2)" }}>
                <p className="truncate text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {session.name}
                </p>
                <p className="font-serif-d text-xl font-bold tabular-nums">
                  +{roundResult.playerCorrect ? 1 : 0}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--surface2)" }}>
                <p className="truncate text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {t.word.computer}
                </p>
                <p className="font-serif-d text-xl font-bold tabular-nums">
                  +{roundResult.botCorrect ? 1 : 0}
                </p>
              </div>
            </div>

            <button type="button" className="btn btn-gold mt-4 w-full" onClick={() => advance()}>
              {isLast ? t.word.seeResults : t.word.nextQuestion}
            </button>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--muted)" }}>
              {t.word.autoNext}
            </p>
          </div>
        )}
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
