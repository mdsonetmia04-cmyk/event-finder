/* Chess board themes + piece styles. Three board themes (owner's
   order: wooden board colour, plus an old/classic look and a new/
   modern look) and two piece styles (realistic + flat 2D), both
   switchable in-game and remembered per device.

   The realistic pieces are the Cburnett set bundled as local static
   assets under public/chess/cburnett/ (no runtime CDN dependency).
   Attribution: chess pieces by Cburnett, via Wikimedia Commons,
   multi-licensed GFDL / BSD / GPL — see
   public/chess/cburnett/ATTRIBUTION.txt. */

export type ChessThemeId = "wooden" | "classic" | "modern";
export type ChessPieceStyle = "realistic" | "flat";

export interface ChessTheme {
  id: ChessThemeId;
  light: string;
  dark: string;
  frame: string;
  /** Coordinate label colour on light / dark squares. */
  coordOnLight: string;
  coordOnDark: string;
  /** Last-move tint, selection tint, legal-move dots, capture ring,
      and the red glow on a king in check. */
  lastMove: string;
  selected: string;
  dotOnLight: string;
  dotOnDark: string;
  captureRing: string;
  checkGlow: string;
}

export const CHESS_THEMES: Record<ChessThemeId, ChessTheme> = {
  wooden: {
    id: "wooden",
    light: "#EBD0A0",
    dark: "#9C6B41",
    frame: "#7C4F27",
    coordOnLight: "#9C6B41",
    coordOnDark: "#EBD0A0",
    lastMove: "rgba(232, 169, 12, 0.45)",
    selected: "rgba(217, 160, 68, 0.65)",
    dotOnLight: "rgba(60, 35, 12, 0.30)",
    dotOnDark: "rgba(255, 244, 214, 0.45)",
    captureRing: "rgba(217, 160, 68, 0.95)",
    checkGlow: "rgba(229, 72, 77, 0.80)",
  },
  classic: {
    id: "classic",
    light: "#F0EAD8",
    dark: "#647D4F",
    frame: "#42563A",
    coordOnLight: "#647D4F",
    coordOnDark: "#F0EAD8",
    lastMove: "rgba(232, 169, 12, 0.45)",
    selected: "rgba(217, 160, 68, 0.65)",
    dotOnLight: "rgba(40, 55, 30, 0.30)",
    dotOnDark: "rgba(255, 250, 235, 0.45)",
    captureRing: "rgba(217, 160, 68, 0.95)",
    checkGlow: "rgba(229, 72, 77, 0.80)",
  },
  modern: {
    id: "modern",
    light: "#CBD5DC",
    dark: "#46586A",
    frame: "#20262E",
    coordOnLight: "#46586A",
    coordOnDark: "#CBD5DC",
    lastMove: "rgba(217, 160, 68, 0.50)",
    selected: "rgba(217, 160, 68, 0.70)",
    dotOnLight: "rgba(32, 38, 46, 0.30)",
    dotOnDark: "rgba(235, 240, 244, 0.45)",
    captureRing: "rgba(217, 160, 68, 0.95)",
    checkGlow: "rgba(229, 72, 77, 0.85)",
  },
};

export const CHESS_THEME_IDS: ChessThemeId[] = ["wooden", "classic", "modern"];
export const CHESS_PIECE_STYLES: ChessPieceStyle[] = ["realistic", "flat"];

const THEME_KEY = "ssc:chess:theme";
const PIECES_KEY = "ssc:chess:pieces";

function storageGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the in-memory choice still applies.
  }
}

export function loadChessTheme(): ChessThemeId {
  const raw = storageGet(THEME_KEY);
  if (raw === "wooden" || raw === "classic" || raw === "modern") return raw;
  return "wooden";
}

export function saveChessTheme(id: ChessThemeId): void {
  storageSet(THEME_KEY, id);
}

export function loadChessPieceStyle(): ChessPieceStyle {
  const raw = storageGet(PIECES_KEY);
  if (raw === "realistic" || raw === "flat") return raw;
  return "realistic";
}

export function saveChessPieceStyle(style: ChessPieceStyle): void {
  storageSet(PIECES_KEY, style);
}
