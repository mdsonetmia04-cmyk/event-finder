"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Play } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { SectionHeader } from "@/components/ui";
import LudoGame, { type LudoPlayerMeta } from "@/components/LudoGame";
import {
  applyMove,
  applyRoll,
  botMove,
  createGame,
  legalMoves,
  rollDie,
  type LudoState,
} from "@/lib/ludo/engine";

type PlayerCount = 2 | 3 | 4;

export default function SoloLudoPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState<PlayerCount>(4);
  const [game, setGame] = useState<LudoState | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  /* Bot turns: roll after ~800ms, move after ~700ms. */
  useEffect(() => {
    if (!game || game.phase === "finished" || game.turn === 0) return;
    if (game.phase === "roll") {
      const id = window.setTimeout(() => {
        setDiceRolling(true);
        const roll = rollDie();
        const settle = window.setTimeout(() => {
          setGame((g) => (g && g.phase === "roll" ? applyRoll(g, roll) : g));
          setDiceRolling(false);
        }, 800);
        timersRef.current.push(settle);
      }, 800);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setGame((g) => {
        if (!g || g.phase !== "move" || g.roll === null) return g;
        return applyMove(g, { token: botMove(g, g.roll) });
      });
    }, 700);
    return () => window.clearTimeout(id);
  }, [game]);

  /* After a human roll with zero legal moves, auto-pass after ~900ms. */
  useEffect(() => {
    if (!game || game.phase !== "move" || game.turn !== 0 || game.roll === null) return;
    if (legalMoves(game, game.roll).length > 0) return;
    const id = window.setTimeout(() => {
      setGame((g) => (g && g.phase === "move" ? applyMove(g, { token: null }) : g));
    }, 900);
    return () => window.clearTimeout(id);
  }, [game]);

  const handleRoll = useCallback(() => {
    if (!game || game.phase !== "roll" || game.turn !== 0 || diceRolling) return;
    setDiceRolling(true);
    const roll = rollDie();
    const id = window.setTimeout(() => {
      setGame((g) => (g && g.phase === "roll" ? applyRoll(g, roll) : g));
      setDiceRolling(false);
    }, 800);
    timersRef.current.push(id);
  }, [game, diceRolling]);

  const handleToken = useCallback((token: number) => {
    setGame((g) => (g && g.phase === "move" ? applyMove(g, { token }) : g));
  }, []);

  /* Timeout auto-play: same loop as multiplayer — play the current turn
     until the turn passes or the game ends. */
  const handleTimeout = useCallback(() => {
    setGame((g) => {
      if (!g || g.phase === "finished") return g;
      let auto = g;
      const startTurn = auto.turn;
      for (let i = 0; i < 10; i++) {
        if (auto.phase === "finished" || auto.turn !== startTurn) break;
        if (auto.phase === "roll") auto = applyRoll(auto, rollDie());
        else if (auto.phase === "move" && auto.roll !== null) {
          auto = applyMove(auto, { token: botMove(auto, auto.roll) });
        } else break;
      }
      return auto;
    });
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

  if (!game) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <SectionHeader title={t.ludo.setupTitle} subtitle={t.ludo.setupSub} />
        <div className="card p-5 sm:p-6">
          <p className="text-sm font-semibold">{t.ludo.choosePlayers}</p>
          <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label={t.ludo.choosePlayers}>
            {([2, 3, 4] as PlayerCount[]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPlayerCount(n)}
                aria-pressed={playerCount === n}
                className={`btn ${playerCount === n ? "btn-active" : "btn-ghost"}`}
              >
                {t.ludo.playersLabel(n)}
              </button>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            <Bot size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t.ludo.youPlayRed}
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.rulesNote}
          </p>
          <button type="button" className="btn btn-gold mt-5 w-full" onClick={() => setGame(createGame(playerCount))}>
            <Play size={17} aria-hidden="true" />
            {t.ludo.startGame}
          </button>
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

  const metas: LudoPlayerMeta[] = game.players.map((_, i) =>
    i === 0
      ? { name: session.name, avatar_url: session.avatar_url ?? null, isBot: false, isYou: true }
      : { name: t.ludo.computerName(i), avatar_url: null, isBot: true, isYou: false },
  );
  const canRoll = game.phase === "roll" && game.turn === 0 && !diceRolling;
  const canMove = game.phase === "move" && game.turn === 0 && !diceRolling;
  const movable = canMove && game.roll !== null ? legalMoves(game, game.roll) : [];

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
        timerActive={game.phase !== "finished"}
        onRoll={handleRoll}
        onToken={handleToken}
        onTimeout={handleTimeout}
        onPlayAgain={() => setGame(null)}
        onExit={() => router.push("/games")}
        exitLabel={t.games.backToZone}
      />
    </div>
  );
}
