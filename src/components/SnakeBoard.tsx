import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SubLevel } from "@/game/levels";
import { sounds } from "@/game/sounds";
import { cn } from "@/lib/utils";

type Dir = "up" | "down" | "left" | "right";
type Cell = { x: number; y: number };
type Item = Cell & { value: string; id: number };

interface Props {
  subLevel: SubLevel;
  onFinish: (result: { correct: number; wrong: number; completed: boolean }) => void;
  onExit: () => void;
}

const COLS = 14;
const ROWS = 18;

const opposite = (a: Dir, b: Dir) =>
  (a === "up" && b === "down") ||
  (a === "down" && b === "up") ||
  (a === "left" && b === "right") ||
  (a === "right" && b === "left");

const eqCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

let itemSeq = 0;

export const SnakeBoard = ({ subLevel, onExit, onFinish }: Props) => {
  const [snake, setSnake] = useState<Cell[]>(() => [
    { x: 7, y: 9 },
    { x: 6, y: 9 },
    { x: 5, y: 9 },
  ]);
  const [dir, setDir] = useState<Dir>("right");
  const dirRef = useRef<Dir>("right");
  const queuedDir = useRef<Dir | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [targetIdx, setTargetIdx] = useState(0); // index into subLevel.sequence
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shake, setShake] = useState(false);
  const [popCell, setPopCell] = useState<Cell | null>(null);

  const target = subLevel.sequence[targetIdx];
  const totalNeeded = Math.min(subLevel.sequence.length, 12); // first 12 in-sequence wins the round
  const finishedRef = useRef(false);

  // spawn items: always include the next target + a few distractors
  const spawnItems = useCallback(
    (currentSnake: Cell[], nextIdx: number) => {
      const occupied = new Set(currentSnake.map((c) => `${c.x},${c.y}`));
      const placed: Item[] = [];
      const tryPlace = (value: string) => {
        for (let i = 0; i < 50; i++) {
          const x = Math.floor(Math.random() * COLS);
          const y = Math.floor(Math.random() * ROWS);
          const k = `${x},${y}`;
          if (occupied.has(k)) continue;
          occupied.add(k);
          placed.push({ x, y, value, id: ++itemSeq });
          return;
        }
      };
      // Show the next N items in sequence order starting from the current target.
      // This way kids see 1,2,3,4,5 (or A,B,C,D,E) on the board and must eat them in order.
      const count = Math.min(subLevel.itemsOnBoard, subLevel.sequence.length - nextIdx);
      for (let i = 0; i < count; i++) {
        const v = subLevel.sequence[nextIdx + i];
        if (v !== undefined) tryPlace(v);
      }
      setItems(placed);
    },
    [subLevel]
  );

  // initial spawn
  useEffect(() => {
    spawnItems(snake, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subLevel.id]);

  // input
  const setDirection = useCallback((d: Dir) => {
    if (opposite(dirRef.current, d)) return;
    queuedDir.current = d;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const d = map[e.key];
      if (d) { e.preventDefault(); setDirection(d); }
      if (e.key === " ") setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDirection]);

  // touch swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? "right" : "left");
    else setDirection(dy > 0 ? "down" : "up");
    touchStart.current = null;
  };

  // game tick
  useEffect(() => {
    if (paused || finishedRef.current) return;
    const id = setInterval(() => {
      setSnake((prev) => {
        const nd = queuedDir.current ?? dirRef.current;
        dirRef.current = nd;
        queuedDir.current = null;
        setDir(nd);
        const head = prev[0];
        const next = { ...head };
        if (nd === "up") next.y -= 1;
        if (nd === "down") next.y += 1;
        if (nd === "left") next.x -= 1;
        if (nd === "right") next.x += 1;
        // wrap around walls (kid friendly — no instant death)
        next.x = (next.x + COLS) % COLS;
        next.y = (next.y + ROWS) % ROWS;

        // self collision -> small shake, no death
        if (prev.some((s) => eqCell(s, next))) {
          setShake(true);
          setTimeout(() => setShake(false), 400);
          return prev;
        }

        // check items
        const hit = items.find((it) => eqCell(it, next));
        let newSnake = [next, ...prev];
        if (hit) {
          if (hit.value === target) {
            sounds.eat();
            setPopCell({ x: hit.x, y: hit.y });
            setTimeout(() => setPopCell(null), 300);
            setCorrect((c) => c + 1);
            const nextIdx = targetIdx + 1;
            // grow snake (don't pop tail)
            if (nextIdx >= totalNeeded) {
              finishedRef.current = true;
              sounds.win();
              setTimeout(
                () => onFinish({ correct: correct + 1, wrong, completed: true }),
                400
              );
              return newSnake;
            }
            setTargetIdx(nextIdx);
            // respawn items based on the new snake position
            setTimeout(() => spawnItems(newSnake, nextIdx), 0);
            return newSnake;
          } else {
            sounds.wrong();
            setWrong((w) => w + 1);
            setShake(true);
            setTimeout(() => setShake(false), 400);
            // remove the wrong item, don't grow
            setItems((curr) => curr.filter((i) => i.id !== hit.id));
            newSnake.pop();
            return newSnake;
          }
        }

        newSnake.pop();
        return newSnake;
      });
    }, subLevel.speedMs);
    return () => clearInterval(id);
  }, [paused, items, target, targetIdx, totalNeeded, correct, wrong, subLevel.speedMs, spawnItems, onFinish]);

  const cellPx = 100 / COLS; // % width per cell
  const cellPxY = 100 / ROWS;

  const fontClass = subLevel.fontClass ?? "";

  const progress = useMemo(() => `${targetIdx} / ${totalNeeded}`, [targetIdx, totalNeeded]);

  return (
    <div className="w-full h-full flex flex-col items-center gap-3 p-3">
      {/* Top HUD */}
      <div className="w-full max-w-md flex items-center justify-between gap-2">
        <button onClick={onExit} className="kid-btn bg-card px-3 py-2 text-sm">← Exit</button>
        <div className="kid-card px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Find</span>
          <span className={cn("text-2xl font-extrabold text-primary", fontClass)}>{target}</span>
        </div>
        <button onClick={() => setPaused((p) => !p)} className="kid-btn bg-card px-3 py-2 text-sm">
          {paused ? "▶" : "⏸"}
        </button>
      </div>
      <div className="w-full max-w-md flex items-center justify-between text-sm font-bold">
        <span className="text-success">✓ {correct}</span>
        <span className="text-muted-foreground">{progress}</span>
        <span className="text-destructive">✗ {wrong}</span>
      </div>

      {/* Board */}
      <div
        className={cn(
          "relative w-full max-w-md aspect-[14/18] rounded-[var(--radius)] overflow-hidden border-4 border-primary/30 bg-board",
          shake && "animate-shake"
        )}
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--board-grid)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--board-grid)) 1px, transparent 1px)",
          backgroundSize: `${100 / COLS}% ${100 / ROWS}%`,
          touchAction: "none",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* items */}
        {items.map((it) => (
          <div
            key={it.id}
            className={cn(
              "absolute flex items-center justify-center font-extrabold rounded-full shadow-md animate-scale-in",
              it.value === target ? "bg-warning text-warning-foreground ring-2 ring-warning/60 animate-pop" : "bg-card text-foreground"
            )}
            style={{
              left: `${it.x * cellPx}%`,
              top: `${it.y * cellPxY}%`,
              width: `${cellPx}%`,
              height: `${cellPxY}%`,
              fontSize: "clamp(10px, 2.4vw, 18px)",
            }}
          >
            <span className={fontClass}>{it.value}</span>
          </div>
        ))}

        {/* snake */}
        {snake.map((s, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-md transition-[left,top] duration-100",
              i === 0 ? "bg-snake-head" : "bg-snake-body"
            )}
            style={{
              left: `${s.x * cellPx}%`,
              top: `${s.y * cellPxY}%`,
              width: `${cellPx}%`,
              height: `${cellPxY}%`,
              boxShadow: i === 0 ? "0 0 12px hsl(var(--primary-glow))" : undefined,
            }}
          >
            {i === 0 && (
              <div className="w-full h-full relative">
                <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </div>
        ))}

        {popCell && (
          <div
            className="absolute pointer-events-none animate-star-burst text-2xl"
            style={{ left: `${popCell.x * cellPx}%`, top: `${popCell.y * cellPxY}%`, width: `${cellPx}%`, height: `${cellPxY}%`, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ⭐
          </div>
        )}

        {paused && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <div className="kid-card p-6 text-center">
              <div className="text-2xl font-bold mb-2">Paused</div>
              <button onClick={() => setPaused(false)} className="kid-btn gradient-primary text-primary-foreground px-6 py-3">Resume ▶</button>
            </div>
          </div>
        )}
      </div>

      {/* Direction pad */}
      <div className="w-44 grid grid-cols-3 gap-2 mt-1 select-none">
        <div />
        <button onClick={() => setDirection("up")} className="kid-btn bg-card aspect-square text-2xl">▲</button>
        <div />
        <button onClick={() => setDirection("left")} className="kid-btn bg-card aspect-square text-2xl">◀</button>
        <button onClick={() => setPaused((p) => !p)} className="kid-btn bg-secondary text-secondary-foreground aspect-square text-xl">{paused ? "▶" : "⏸"}</button>
        <button onClick={() => setDirection("right")} className="kid-btn bg-card aspect-square text-2xl">▶</button>
        <div />
        <button onClick={() => setDirection("down")} className="kid-btn bg-card aspect-square text-2xl">▼</button>
        <div />
      </div>
    </div>
  );
};
