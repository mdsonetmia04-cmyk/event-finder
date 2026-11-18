/* Bubble Shooter engine — headless, deterministic simulation.
   Renderer-agnostic: this module never imports canvas, DOM, or
   audio code. It owns the grid, the projectile, the resolution
   pipeline (snap → match → orphans → scoring → push → win/lose),
   and emits plain-data events the presentation layer turns into
   juice. No Math.random() anywhere in here: three independent
   seeded streams (board, shots, FX jitter) derive from the level
   seed, so the same level always plays the same way.

   State machine: aiming → flying → resolving → aiming, ending in
   won/failed. finishResolving() is called by the presentation layer
   once its animations complete; the sim never waits on visuals for
   correctness. */

import {
  ballAt,
  cellToWorld,
  dangerLineY,
  distSq,
  inBounds,
  key,
  keyRC,
  neighbours,
  R,
  ROW_H,
  rowCellCount,
  worldToCell,
  type CellRef,
  type GridCells,
  type Vec2,
} from "./grid";
import { clusterDepths, findCluster, findOrphans, pickShotColor } from "./matcher";
import { hashCombine, Rng } from "./rng";
import { TUNING, type BallColor } from "./tuning";
import { generateBoard, starsForScore, type BubbleLevel } from "./levels";

export type EnginePhase = "aiming" | "flying" | "resolving" | "won" | "failed";

export interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BallColor;
  bounces: number;
}

export interface PopCell {
  cell: CellRef;
  color: BallColor;
  /** Ring depth from the landed ball; drives the stagger wave. */
  depth: number;
}

export interface DropCell {
  cell: CellRef;
  color: BallColor;
}

export type EngineEvent =
  | { type: "fire"; color: BallColor; angle: number }
  | { type: "bounce"; side: "left" | "right"; x: number; y: number }
  | { type: "stick"; cell: CellRef; color: BallColor; impactX: number; impactY: number }
  | { type: "refund" }
  | { type: "pop"; cells: PopCell[]; groupSize: number; points: number; multiplier: number }
  | { type: "drop"; cells: DropCell[]; count: number; points: number }
  | { type: "push" }
  | { type: "combo"; step: number; multiplier: number }
  | { type: "resolved"; cleared: number; scored: boolean }
  | { type: "outcome"; result: "won" | "failed"; score: number; stars: 1 | 2 | 3 };

export type StepResult =
  | { kind: "none" }
  | { kind: "bounce"; side: "left" | "right" }
  | { kind: "land"; contact: Vec2; ceiling: boolean };

/** Advance the projectile one fixed step. Reads grid occupancy only.
    Collision is the 7-check trick: the grid cell nearest the ball
    plus its 6 neighbours, circle-vs-circle (distance < 2R). At
    120Hz the ball moves 0.18 units per step — far less than a ball
    diameter — so discrete checks cannot tunnel. Shared verbatim
    with the trajectory predictor so the preview can never lie. */
export function stepProjectile(
  p: ProjectileState,
  dt: number,
  cells: GridCells,
  parity: 0 | 1,
  cols: number,
): StepResult {
  const left = R;
  const right = TUNING.WORLD_W - R;
  let nx = p.x + p.vx * dt;
  const ny = p.y + p.vy * dt;

  // 1. Wall reflection.
  if (nx < left) {
    nx = left + (left - nx);
    p.x = nx;
    p.y = ny;
    p.vx = -p.vx;
    p.bounces += 1;
    return { kind: "bounce", side: "left" };
  }
  if (nx > right) {
    nx = right - (nx - right);
    p.x = nx;
    p.y = ny;
    p.vx = -p.vx;
    p.bounces += 1;
    return { kind: "bounce", side: "right" };
  }

  // 2. Collision vs occupied balls (radius = sum of radii = 2R).
  const seed = worldToCell({ x: nx, y: ny }, parity, cols);
  const candidates = [seed, ...neighbours(seed, parity, cols)];
  const sum = 2 * R;
  for (const c of candidates) {
    if (ballAt(cells, c) === null) continue;
    const w = cellToWorld(c.row, c.col, parity, cols);
    const dx = nx - w.x;
    const dy = ny - w.y;
    if (dx * dx + dy * dy < sum * sum) {
      p.x = nx;
      p.y = ny;
      return { kind: "land", contact: { x: nx, y: ny }, ceiling: false };
    }
  }

  // 3. Ceiling.
  if (ny <= R) {
    p.x = nx;
    p.y = R;
    return { kind: "land", contact: { x: nx, y: R }, ceiling: true };
  }

  p.x = nx;
  p.y = ny;
  return { kind: "none" };
}

/** The cell a shot occupies after snapping: the nearest EMPTY cell
    among the seed cell + its neighbours, by distance to the contact
    point. Ties break deterministically: deeper row wins, then the
    left column. Ring-2 fallback when all 7 are occupied; null when
    even that fails (pathological full board — the shot is
    refunded). */
export function snapToGrid(
  contact: Vec2,
  cells: GridCells,
  parity: 0 | 1,
  cols: number,
): CellRef | null {
  const seed = worldToCell(contact, parity, cols);
  const candidates = [seed, ...neighbours(seed, parity, cols)];
  let best: CellRef | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    if (!inBounds(c.row, c.col, cols, parity)) continue;
    if (ballAt(cells, c) !== null) continue;
    const d = distSq(contact, cellToWorld(c.row, c.col, parity, cols));
    if (
      best === null ||
      d < bestDist - 1e-9 ||
      (Math.abs(d - bestDist) <= 1e-9 &&
        (c.row > best.row || (c.row === best.row && c.col < best.col)))
    ) {
      bestDist = d;
      best = c;
    }
  }
  if (best) return best;
  return ring2Fallback(contact, cells, parity, cols);
}

function ring2Fallback(
  contact: Vec2,
  cells: GridCells,
  parity: 0 | 1,
  cols: number,
): CellRef | null {
  const seed = worldToCell(contact, parity, cols);
  const order: CellRef[] = [];
  for (let r = 1; r <= 2; r++) {
    for (let dr = -r; dr <= r; dr++) {
      for (let dc = -r; dc <= r; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== r) continue;
        order.push({ row: seed.row + dr, col: seed.col + dc });
      }
    }
  }
  order.sort((a, b) => {
    const ad = distSq(contact, cellToWorld(a.row, a.col, parity, cols));
    const bd = distSq(contact, cellToWorld(b.row, b.col, parity, cols));
    if (Math.abs(ad - bd) > 1e-9) return ad - bd;
    if (a.row !== b.row) return b.row - a.row;
    return a.col - b.col;
  });
  for (const c of order) {
    if (inBounds(c.row, c.col, cols, parity) && ballAt(cells, c) === null) return c;
  }
  return null;
}

export interface Prediction {
  /** Polyline through the flight path, including bounce corners. */
  points: Vec2[];
  /** Cell the shot would land in, or null if truncated. */
  ghost: CellRef | null;
  truncated: boolean;
}

/** Trajectory prediction — reuses stepProjectile verbatim so the
    preview cannot diverge from the real shot. */
export function predictPath(
  origin: Vec2,
  angleRad: number,
  cells: GridCells,
  parity: 0 | 1,
  cols: number,
  maxBounces: number,
): Prediction {
  const v = TUNING.SHOT_SPEED;
  const prox: ProjectileState = {
    x: origin.x,
    y: origin.y,
    vx: Math.sin(angleRad) * v,
    vy: -Math.cos(angleRad) * v,
    color: 0,
    bounces: 0,
  };
  const points: Vec2[] = [{ x: origin.x, y: origin.y }];
  let bounces = 0;
  for (let i = 0; i < TUNING.MAX_PREDICT_STEPS; i++) {
    const r = stepProjectile(prox, TUNING.SIM_DT, cells, parity, cols);
    if (r.kind === "bounce") {
      points.push({ x: prox.x, y: prox.y });
      if (++bounces > maxBounces) return { points, ghost: null, truncated: true };
    } else if (r.kind === "land") {
      points.push({ x: r.contact.x, y: r.contact.y });
      const ghost = snapToGrid(r.contact, cells, parity, cols);
      return { points, ghost, truncated: false };
    } else if (i % 4 === 0) {
      points.push({ x: prox.x, y: prox.y });
    }
  }
  return { points, ghost: null, truncated: true };
}

export class BubbleEngine {
  readonly level: BubbleLevel;
  readonly cols = TUNING.GRID_COLS;

  cells: GridCells;
  parity: 0 | 1;
  phase: EnginePhase = "aiming";
  score = 0;
  comboStep = 0;
  shotsSincePush = 0;
  shotsFired = 0;
  chamber: BallColor;
  next: BallColor;
  /** Aim angle in radians from vertical; + aims right. */
  aimAngle = 0;
  projectile: ProjectileState | null = null;
  /** Bumped on every grid change so the renderer can invalidate its
      prediction cache. */
  gridVersion = 0;

  private pendingOutcome: "won" | "failed" | null = null;
  private cooldown = 0;
  private readonly rngLevel: Rng;
  private readonly rngShots: Rng;
  /** FX jitter stream — deterministic visuals, same every retry. */
  readonly rngFx: Rng;
  private readonly listeners = new Set<(e: EngineEvent) => void>();

  constructor(level: BubbleLevel) {
    this.level = level;
    const built = generateBoard(level);
    this.cells = built.cells;
    this.parity = built.parity;
    this.rngLevel = new Rng(hashCombine(level.seed, 0x51ab));
    this.rngShots = new Rng(hashCombine(level.seed, 0x9e37));
    this.rngFx = new Rng(hashCombine(level.seed, 0x1f2d));
    this.chamber = pickShotColor(this.cells, this.rngShots, level.colorCount);
    this.next = pickShotColor(this.cells, this.rngShots, level.colorCount);
  }

  onEvent(cb: (e: EngineEvent) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private emit(e: EngineEvent): void {
    for (const cb of this.listeners) cb(e);
  }

  get multiplier(): number {
    return Math.min(TUNING.COMBO_MAX, 1 + TUNING.COMBO_STEP * this.comboStep);
  }

  get shotsToPush(): number {
    return Math.max(0, this.level.pushInterval - this.shotsSincePush);
  }

  get ballCount(): number {
    return this.cells.size;
  }

  lowestOccupiedRow(): number {
    let lowest = -1;
    for (const k of this.cells.keys()) {
      const row = Math.floor(k / 64);
      if (row > lowest) lowest = row;
    }
    return lowest;
  }

  /** Danger level 0..3 from the lowest occupied row's distance to
      the death row. */
  dangerLevel(): number {
    const lowest = this.lowestOccupiedRow();
    if (lowest < 0) return 0;
    const gap = TUNING.DEATH_ROW - lowest;
    if (gap <= TUNING.DANGER_ROWS[2]) return 3;
    if (gap <= TUNING.DANGER_ROWS[1]) return 2;
    if (gap <= TUNING.DANGER_ROWS[0]) return 1;
    return 0;
  }

  setAim(angleRad: number): void {
    const max = (TUNING.MAX_AIM_DEG * Math.PI) / 180;
    this.aimAngle = Math.max(-max, Math.min(max, angleRad));
  }

  /** Aim from a world point (pointer position): the angle from the
      launcher to the point, clamped. */
  aimAt(point: Vec2): void {
    const dx = point.x - TUNING.LAUNCHER_X;
    const dy = TUNING.LAUNCHER_Y - point.y;
    this.setAim(Math.atan2(dx, dy));
  }

  /** Exchange the loaded ball with the next ball. Aiming only. */
  swap(): boolean {
    if (this.phase !== "aiming") return false;
    const tmp = this.chamber;
    this.chamber = this.next;
    this.next = tmp;
    return true;
  }

  fire(): boolean {
    if (this.phase !== "aiming" || this.cooldown > 0) return false;
    const v = TUNING.SHOT_SPEED;
    this.projectile = {
      x: TUNING.LAUNCHER_X,
      y: TUNING.LAUNCHER_Y,
      vx: Math.sin(this.aimAngle) * v,
      vy: -Math.cos(this.aimAngle) * v,
      color: this.chamber,
      bounces: 0,
    };
    this.phase = "flying";
    this.cooldown = TUNING.SHOT_COOLDOWN;
    this.emit({ type: "fire", color: this.chamber, angle: this.aimAngle });
    return true;
  }

  fixedUpdate(dt: number): void {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.phase !== "flying" || !this.projectile) return;
    const p = this.projectile;
    const r = stepProjectile(p, dt, this.cells, this.parity, this.cols);
    if (r.kind === "bounce") {
      this.emit({ type: "bounce", side: r.side, x: p.x, y: p.y });
    } else if (r.kind === "land") {
      this.projectile = null;
      this.resolveLanding(r.contact);
    }
  }

  private resolveLanding(contact: Vec2): void {
    const color = this.chamber;
    const target = snapToGrid(contact, this.cells, this.parity, this.cols);
    if (!target) {
      // Pathological full board — refund the shot, keep the ball.
      this.phase = "aiming";
      this.emit({ type: "refund" });
      return;
    }
    this.cells.set(key(target), color);
    this.gridVersion += 1;
    this.shotsFired += 1;
    this.shotsSincePush += 1;
    this.emit({
      type: "stick",
      cell: target,
      color,
      impactX: contact.x,
      impactY: contact.y,
    });

    const mult = this.multiplier;
    let scored = false;
    let clearedTotal = 0;

    // 1. Match: 3+ connected same-colour balls pop.
    const cluster = findCluster(this.cells, this.parity, this.cols, target, color);
    if (cluster.length >= TUNING.MIN_MATCH) {
      const depths = clusterDepths(this.cells, this.parity, this.cols, target, color);
      const popCells: PopCell[] = cluster.map((cell) => ({
        cell,
        color: ballAt(this.cells, cell) as BallColor,
        depth: depths.get(key(cell)) ?? 0,
      }));
      for (const cell of cluster) this.cells.delete(key(cell));
      const points = Math.round(cluster.length * TUNING.POINTS_POP * mult);
      this.score += points;
      clearedTotal += cluster.length;
      scored = true;
      this.gridVersion += 1;
      this.emit({ type: "pop", cells: popCells, groupSize: cluster.length, points, multiplier: mult });
    }

    // 2. Orphans: balls cut off from row 0 drop (double value).
    const orphans = findOrphans(this.cells, this.parity, this.cols);
    if (orphans.length > 0) {
      const dropCells: DropCell[] = orphans.map((cell) => ({
        cell,
        color: ballAt(this.cells, cell) as BallColor,
      }));
      for (const cell of orphans) this.cells.delete(key(cell));
      const perBall =
        orphans.length >= TUNING.DROP_BIG_COUNT ? TUNING.POINTS_DROP_BIG : TUNING.POINTS_DROP;
      const points = Math.round(orphans.length * perBall * mult);
      this.score += points;
      clearedTotal += orphans.length;
      scored = true;
      this.gridVersion += 1;
      this.emit({ type: "drop", cells: dropCells, count: orphans.length, points });
    }

    // 3. Combo: a scoring shot builds the multiplier, a blank shot resets it.
    if (scored) {
      this.comboStep += 1;
    } else {
      this.comboStep = 0;
    }
    this.emit({ type: "combo", step: this.comboStep, multiplier: this.multiplier });

    // 4. Ceiling pressure: after N landed shots a new row pushes in.
    // Mercy rule: no push while few balls remain, so the endgame is
    // always finishable.
    if (this.shotsSincePush >= this.level.pushInterval) {
      this.shotsSincePush = 0;
      if (this.cells.size > TUNING.MERCY_CLEAR_SIZE) {
        this.pushRow();
        this.emit({ type: "push" });
      }
    }

    // 5. Win/lose, checked after the whole resolution.
    if (this.cells.size === 0) {
      const bonus = this.level.n * 500;
      this.score += bonus;
      this.pendingOutcome = "won";
    } else if (this.lowestOccupiedRow() >= TUNING.DEATH_ROW) {
      this.pendingOutcome = "failed";
    }

    // 6. Deal the next ball from the colours still on the board.
    this.chamber = this.next;
    this.next = pickShotColor(this.cells, this.rngShots, this.level.colorCount);

    this.emit({ type: "resolved", cleared: clearedTotal, scored });
    this.phase = "resolving";
  }

  /** Insert a new full row at the top, shift everything down one
      row, flip parity. The parity flip preserves every row's length,
      so each ball keeps its world X and drops exactly one row. */
  private pushRow(): void {
    const newParity = (this.parity ^ 1) as 0 | 1;
    const next: GridCells = new Map();
    const newCount = rowCellCount(0, newParity, this.cols);
    for (let col = 0; col < newCount; col++) {
      next.set(keyRC(0, col), this.rngLevel.int(this.level.colorCount) as BallColor);
    }
    for (const [k, color] of this.cells) {
      const row = Math.floor(k / 64) + 1;
      const col = k % 64;
      if (row < TUNING.ROW_CAPACITY) {
        next.set(keyRC(row, col), color);
      }
    }
    this.cells = next;
    this.parity = newParity;
    this.gridVersion += 1;
  }

  /** Called by the presentation layer once its animations for the
      last resolution have played out. Moves to the outcome state
      when one is pending, otherwise back to aiming. */
  finishResolving(): void {
    if (this.phase !== "resolving") return;
    if (this.pendingOutcome) {
      const result = this.pendingOutcome;
      this.pendingOutcome = null;
      this.phase = result === "won" ? "won" : "failed";
      this.emit({
        type: "outcome",
        result,
        score: this.score,
        stars: result === "won" ? starsForScore(this.level, this.score) : 1,
      });
    } else {
      this.phase = "aiming";
    }
  }

  /** Y of the danger line in world units (for the renderer). */
  dangerY(): number {
    return dangerLineY();
  }

  /** Launcher world position (for the renderer + predictor). */
  launcherPos(): Vec2 {
    return { x: TUNING.LAUNCHER_X, y: TUNING.LAUNCHER_Y };
  }

  /** Row height in world units (for the push-slide animation). */
  rowHeight(): number {
    return ROW_H;
  }
}
