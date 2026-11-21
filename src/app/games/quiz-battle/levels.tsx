"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Check,
  Clock,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Star,
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
  correctDisplayIndex,
  planBotAnswer,
  type BattleQuestion,
  type BotPlan,
} from "@/lib/quiz/adobe-stock-questions";
import {
  applyLevelResult,
  bandForLevel,
  botAccuracyForLevel,
  drawLevelQuestions,
  loadLevelsProgress,
  saveLevelsProgress,
  starsForCorrect,
  LEVEL_BANDS,
  LEVELS_COUNT,
  LEVEL_QUESTION_MS,
  QUESTIONS_PER_LEVEL,
  type LevelsProgress,
} from "@/lib/quiz/levels";
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

const REVEAL_MS = 8000;

const GREEN = "#2FA36B";
const RED = "#E5484D";

type Phase = "select" | "playing" | "reveal" | "results";

interface RoundRecord {
  number: number;
  bq: BattleQuestion;
  playerPick: number | null;
  botPick: number;
  playerCorrect: boolean;
  botCorrect: boolean;
  /** Marks gained this round (levels scoring: 1 per correct answer). */
  playerGain: number;
  botGain: number;
}

interface RoundResult {
  playerPick: number | null;
  botPick: number;
  timedOut: boolean;
  playerCorrect: boolean;
  botCorrect: boolean;
  playerGain: number;
  botGain: number;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function QuizLevels({ onExit }: { onExit: () => void }) {
  const { t, lang } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("select");
  const [progress, setProgress] = useState<LevelsProgress>(() => loadLevelsProgress());
  const [level, setLevel] = useState(1);
  const [battle, setBattle] = useState<BattleQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(LEVEL_QUESTION_MS);
  const [botAnswered, setBotAnswered] = useState(false);
  const [playerMarks, setPlayerMarks] = useState(0);
  const [botMarks, setBotMarks] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [review, setReview] = useState<RoundRecord[]>([]);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  /** Adobe Stock nudge: shown from the 3rd session win onward. */
  const [showNudge, setShowNudge] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [unlockedNext, setUnlockedNext] = useState(false);

  /* Refs mirror the values timers need, so callbacks never read stale state. */
  const phaseRef = useRef<Phase>("select");
  const battleRef = useRef<BattleQuestion[]>([]);
  const qIndexRef = useRef(0);
  const marksRef = useRef({ player: 0, bot: 0 });
  const roundRef = useRef<{ bq: BattleQuestion; bot: BotPlan; correctIndex: number } | null>(null);
  const deadlineRef = useRef(0);
  const timeLeftRef = useRef(LEVEL_QUESTION_MS);
  const intervalRef = useRef<number | null>(null);
  const botTimeoutRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  /** Bumps on every level start so each attempt is a distinct win. */
  const attemptIdRef = useRef(0);
  const levelRef = useRef(1);

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
    (index: number, questions: BattleQuestion[], lvl: number) => {
      const bq = questions[index];
      const correctIndex = correctDisplayIndex(bq);
      roundRef.current = {
        bq,
        bot: planBotAnswer(correctIndex, 4, botAccuracyForLevel(lvl)),
        correctIndex,
      };
      qIndexRef.current = index;
      setQIndex(index);
      setRoundResult(null);
      setBotAnswered(false);
      timeLeftRef.current = LEVEL_QUESTION_MS;
      setTimeLeftMs(LEVEL_QUESTION_MS);
      deadlineRef.current = Date.now() + LEVEL_QUESTION_MS;
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
        const lvl = levelRef.current;
        const correct = marksRef.current.player;
        const won = correct > QUESTIONS_PER_LEVEL - correct;
        const result = applyLevelResult(
          loadLevelsProgress(),
          lvl,
          correct,
        );
        saveLevelsProgress(result.progress);
        setProgress(result.progress);
        setStarsEarned(result.stars);
        setUnlockedNext(result.unlockedNext);
        if (won) {
          playWinFanfare();
          const { count } = recordWin(
            "quiz-battle",
            `quiz-battle:level:${lvl}:${attemptIdRef.current}`,
          );
          setShowNudge(count >= NUDGE_AFTER_WINS);
        }
        return;
      }
      startQuestion(qIndexRef.current + 1, battleRef.current, levelRef.current);
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
      /* Levels scoring: 1 mark per correct answer; Sweet AI earns 1 mark
         whenever the player answers wrong or times out. */
      const playerGain = playerCorrect ? 1 : 0;
      const botGain = playerCorrect ? 0 : 1;
      const botCorrect = round.bot.answerIndex === round.correctIndex;

      marksRef.current = {
        player: marksRef.current.player + playerGain,
        bot: marksRef.current.bot + botGain,
      };
      setPlayerMarks(marksRef.current.player);
      setBotMarks(marksRef.current.bot);
      if (playerCorrect) setCorrectCount((c) => c + 1);
      setReview((prev) => [
        ...prev,
        {
          number: qIndexRef.current + 1,
          bq: round.bq,
          playerPick: pick,
          botPick: round.bot.answerIndex,
          playerCorrect,
          botCorrect,
          playerGain,
          botGain,
        },
      ]);
      setRoundResult({
        playerPick: pick,
        botPick: round.bot.answerIndex,
        timedOut: pick === null,
        playerCorrect,
        botCorrect,
        playerGain,
        botGain,
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

  const startLevel = useCallback(
    (lvl: number) => {
      unlockAudio();
      playButtonClick();
      clearTimers();
      attemptIdRef.current += 1;
      setShowNudge(false);
      setStarsEarned(0);
      setUnlockedNext(false);
      levelRef.current = lvl;
      setLevel(lvl);
      const questions = drawLevelQuestions(lvl);
      battleRef.current = questions;
      marksRef.current = { player: 0, bot: 0 };
      setBattle(questions);
      setPlayerMarks(0);
      setBotMarks(0);
      setCorrectCount(0);
      setReview([]);
      startQuestion(0, questions, lvl);
    },
    [clearTimers, startQuestion],
  );

  const backToSelect = useCallback(() => {
    clearTimers();
    phaseRef.current = "select";
    setPhase("select");
    setProgress(loadLevelsProgress());
  }, [clearTimers]);

  const answer = useCallback(
    (displayIndex: number) => {
      if (phaseRef.current !== "playing") return;
      playButtonClick();
      reveal(displayIndex);
    },
    [reveal],
  );

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.ludo.loading}
        </p>
      </div>
    );
  }

  const current = battle[qIndex];
  const isLast = qIndex >= battle.length - 1;
  const secondsLeft = Math.ceil(timeLeftMs / 1000);
  const timerPct = Math.max(0, Math.min(100, (timeLeftMs / LEVEL_QUESTION_MS) * 100));
  const lowTime = phase === "playing" && timeLeftMs <= 5000;
  const maxMarks = Math.max(playerMarks, botMarks, 1);
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);

  const displayOptions = (bq: BattleQuestion): string[] => {
    const list = lang === "bn" ? bq.question.optionsBn : bq.question.options;
    return bq.order.map((i) => list[i]);
  };

  /* ---------------------------- Level select ---------------------------- */
  if (phase === "select") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <SectionHeader
          title={t.quiz.levels.selectTitle}
          subtitle={t.quiz.levels.selectSub}
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
        <div className="card p-5 sm:p-6">
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.quiz.levels.selectDesc}
          </p>
          <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
            <li className="flex items-start gap-2.5">
              <Zap size={17} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.quiz.levels.ruleMarks}
            </li>
            <li className="flex items-start gap-2.5">
              <Trophy size={17} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.quiz.levels.ruleWin}
            </li>
            <li className="flex items-start gap-2.5">
              <Star size={17} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.quiz.levels.ruleStars}
            </li>
            <li className="flex items-start gap-2.5">
              <Clock size={17} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.quiz.levels.ruleHarder}
            </li>
          </ul>
          <p className="mt-4 flex flex-wrap gap-2">
            <span className="chip">{t.quiz.levels.levelsUnlocked(progress.unlocked)}</span>
            <span className="chip">
              <Star size={13} aria-hidden="true" />
              {totalStars}/{LEVELS_COUNT * 3}
            </span>
          </p>
        </div>

        {LEVEL_BANDS.map((band) => (
          <section key={band.name}>
            <h2 className="font-serif-d text-lg font-semibold">
              {lang === "bn" ? band.nameBn : band.name}
              <span className="ml-2 text-sm font-normal" style={{ color: "var(--muted)" }}>
                {t.quiz.levels.levelLabel(band.from)}–{band.to}
              </span>
            </h2>
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: band.to - band.from + 1 }, (_, i) => band.from + i).map((lvl) => {
                const locked = lvl > progress.unlocked;
                const stars = progress.stars[lvl] ?? 0;
                const best = progress.best[lvl];
                return (
                  <button
                    key={lvl}
                    type="button"
                    disabled={locked}
                    onClick={() => startLevel(lvl)}
                    className="card flex flex-col items-center gap-0.5 !p-2 text-center transition-opacity"
                    style={locked ? { opacity: 0.5 } : undefined}
                    aria-label={`${t.quiz.levels.levelLabel(lvl)}${locked ? ` — ${t.quiz.levels.locked}` : ""}`}
                  >
                    {locked ? (
                      <Lock size={16} aria-hidden="true" style={{ color: "var(--muted)" }} />
                    ) : (
                      <span className="font-serif-d text-lg font-bold tabular-nums">{lvl}</span>
                    )}
                    <span className="flex gap-px" aria-hidden="true">
                      {[0, 1, 2].map((s) => (
                        <Star
                          key={s}
                          size={10}
                          style={{ color: s < stars ? "var(--gold)" : "var(--line)" }}
                          fill={s < stars ? "var(--gold)" : "none"}
                        />
                      ))}
                    </span>
                    {best !== undefined && (
                      <span className="text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                        {best}/{QUESTIONS_PER_LEVEL}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <div>
          <button type="button" className="btn btn-ghost" onClick={onExit}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t.quiz.levels.backToSetup}
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------ Results ------------------------------ */
  if (phase === "results") {
    const won = playerMarks > botMarks;
    const draw = playerMarks === botMarks;
    const stars = starsForCorrect(correctCount);
    const wrongFirst = [...review].sort((a, b) => Number(a.playerCorrect) - Number(b.playerCorrect));
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <SectionHeader title={t.quiz.levels.levelLabel(level)} subtitle={t.quiz.resultsTitle} />
        <div className="card p-5 text-center sm:p-6">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white"
            style={{ background: won ? GREEN : "var(--gold)" }}
          >
            <Trophy size={26} aria-hidden="true" />
          </span>
          <h2 className="font-serif-d mt-3 text-2xl font-semibold">
            {draw ? t.quiz.levels.levelDraw : won ? t.quiz.levels.levelWon : t.quiz.levels.levelLost}
          </h2>
          {/* Stars earned */}
          <p className="mt-3 flex justify-center gap-1" aria-label={t.quiz.levels.starsEarned(stars)}>
            {[0, 1, 2].map((s) => (
              <Star
                key={s}
                size={30}
                style={{ color: s < stars ? "var(--gold)" : "var(--line)" }}
                fill={s < stars ? "var(--gold)" : "none"}
                aria-hidden="true"
              />
            ))}
          </p>
          {won && unlockedNext && level < LEVELS_COUNT && (
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>
              {t.quiz.levels.unlockedNext(level + 1)}
            </p>
          )}
          <p className="mt-2 text-base font-bold" style={{ color: "var(--gold-deep)" }}>
            {pickPostMatchLine(won || draw ? "win" : "loss", `quiz-battle:level:${level}:${attemptIdRef.current}`)}
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
              <p className="font-serif-d text-4xl font-bold tabular-nums">{playerMarks}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t.quiz.correctCount(correctCount, QUESTIONS_PER_LEVEL)}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface2)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t.quiz.computer}
              </p>
              <p className="font-serif-d text-4xl font-bold tabular-nums">{botMarks}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t.quiz.levels.aiScoresNote}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {won && level < LEVELS_COUNT && (
              <button
                type="button"
                className="btn btn-gold flex-1"
                onClick={() => startLevel(level + 1)}
                disabled={level + 1 > progress.unlocked}
              >
                <Play size={16} aria-hidden="true" />
                {t.quiz.levels.nextLevel}
              </button>
            )}
            <button type="button" className="btn btn-gold flex-1" onClick={() => startLevel(level)}>
              <RotateCcw size={16} aria-hidden="true" />
              {t.quiz.levels.retryLevel}
            </button>
            <button type="button" className="btn btn-ghost flex-1" onClick={backToSelect}>
              <ArrowLeft size={16} aria-hidden="true" />
              {t.quiz.levels.backToLevels}
            </button>
          </div>
        </div>

        <section>
          <h2 className="font-serif-d text-lg font-semibold">{t.quiz.reviewTitle}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t.quiz.reviewHint}
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {wrongFirst.map((rec) => {
              const opts = displayOptions(rec.bq);
              const correctIdx = correctDisplayIndex(rec.bq);
              const q = rec.bq.question;
              return (
                <article
                  key={rec.bq.question.id}
                  className="card p-4"
                  style={rec.playerCorrect ? undefined : { borderColor: RED }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold leading-relaxed">
                      {t.quiz.questionOf(rec.number, QUESTIONS_PER_LEVEL)} — {lang === "bn" ? q.qBn : q.q}
                    </p>
                    {rec.playerCorrect ? (
                      <Check size={18} className="shrink-0" style={{ color: GREEN }} aria-hidden="true" />
                    ) : (
                      <X size={18} className="shrink-0" style={{ color: RED }} aria-hidden="true" />
                    )}
                  </div>
                  <p className="mt-2 text-sm">
                    <span style={{ color: "var(--muted)" }}>{t.quiz.yourAnswer}: </span>
                    <span style={{ color: rec.playerCorrect ? GREEN : RED, fontWeight: 600 }}>
                      {rec.playerPick === null ? t.quiz.noAnswer : opts[rec.playerPick]}
                    </span>
                  </p>
                  {!rec.playerCorrect && (
                    <p className="mt-1 text-sm">
                      <span style={{ color: "var(--muted)" }}>{t.quiz.correctAnswer}: </span>
                      <span style={{ color: GREEN, fontWeight: 600 }}>{opts[correctIdx]}</span>
                    </p>
                  )}
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    <Bot size={13} className="mr-1 inline" aria-hidden="true" />
                    {t.quiz.botAnswer}: {opts[rec.botPick]}
                    {rec.botCorrect ? " ✓" : " ✗"}
                  </p>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
                    {lang === "bn" ? q.explanationBn : q.explanation}
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
  const q = current.question;
  const options = displayOptions(current);
  const correctIdx = correctDisplayIndex(current);
  const revealing = phase === "reveal";
  const band = bandForLevel(level);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {/* Score race — marks, not points */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--muted)" }}>
          <span>
            {t.quiz.levels.levelLabel(level)} · {lang === "bn" ? band.nameBn : band.name} ·{" "}
            {t.quiz.questionOf(qIndex + 1, battle.length)}
          </span>
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
              <div style={{ width: `${(playerMarks / maxMarks) * 100}%`, background: "var(--gold)" }} />
            </div>
            <span className="w-12 text-right text-sm font-bold tabular-nums">{playerMarks}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-sm font-semibold">
              <Bot size={14} className="mr-1 inline" aria-hidden="true" />
              {t.quiz.computer}
            </span>
            <div className="progress flex-1">
              <div style={{ width: `${(botMarks / maxMarks) * 100}%`, background: "#3E7BFA" }} />
            </div>
            <span className="w-12 text-right text-sm font-bold tabular-nums">{botMarks}</span>
          </div>
        </div>
        {/* Question progress dots */}
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {battle.map((bq, i) => (
            <span
              key={bq.question.id}
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
          <span className="chip">{lang === "bn" ? q.topicBn : q.topic}</span>
          <span
            className="flex items-center gap-1.5 text-sm font-bold tabular-nums"
            style={{ color: lowTime ? RED : "var(--muted)" }}
            aria-label={t.quiz.timeLeft}
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

        <h2 className="font-serif-d mt-4 text-xl font-semibold leading-snug">{lang === "bn" ? q.qBn : q.q}</h2>

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
                  <span className="chip shrink-0 !py-0.5 text-[11px]">{t.quiz.yourAnswer}</span>
                )}
                {showState && isBotPick && (
                  <span className="chip shrink-0 !py-0.5 text-[11px]">
                    <Bot size={12} aria-hidden="true" />
                    {t.quiz.computer}
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
              t.quiz.botAnswered
            ) : (
              <>
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ background: "var(--gold)" }} aria-hidden="true" />
                {t.quiz.botThinking}
              </>
            )}
          </p>
        )}

        {/* Reveal panel */}
        {revealing && roundResult && (
          <div className="mt-4">
            <p className="text-base font-semibold" style={{ color: roundResult.playerCorrect ? GREEN : RED }}>
              {roundResult.timedOut
                ? t.quiz.timeUp
                : roundResult.playerCorrect
                  ? t.quiz.correct
                  : t.quiz.wrong}
              {roundResult.timedOut && !roundResult.playerCorrect && (
                <span className="ml-2 text-sm font-normal" style={{ color: "var(--muted)" }}>
                  {t.quiz.unanswered}
                </span>
              )}
            </p>
            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {lang === "bn" ? q.explanationBn : q.explanation}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl p-3" style={{ background: "var(--surface2)" }}>
                <p className="truncate text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {session.name}
                </p>
                <p className="font-serif-d text-xl font-bold tabular-nums">
                  +{roundResult.playerGain}
                </p>
                <p className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                  {t.quiz.levels.yourMarks}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--surface2)" }}>
                <p className="truncate text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {t.quiz.computer}
                </p>
                <p className="font-serif-d text-xl font-bold tabular-nums">+{roundResult.botGain}</p>
                <p className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                  {t.quiz.levels.aiScoresNote}
                </p>
              </div>
            </div>

            <button type="button" className="btn btn-gold mt-4 w-full" onClick={() => advance()}>
              {isLast ? t.quiz.seeResults : t.quiz.nextQuestion}
            </button>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--muted)" }}>
              {t.quiz.autoNext}
            </p>
          </div>
        )}
      </div>

      <div>
        <button type="button" className="btn btn-ghost" onClick={backToSelect}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.quiz.levels.backToLevels}
        </button>
      </div>
    </div>
  );
}
