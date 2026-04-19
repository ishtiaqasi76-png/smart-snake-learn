import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SubLevel, LevelCategory } from "@/game/levels";
import { sounds } from "@/game/sounds";
import { speech } from "@/game/speech";
import { cn } from "@/lib/utils";
import gardenBg from "@/assets/garden-board.jpg";

type Dir = "up" | "down" | "left" | "right";
type Cell = { x: number; y: number };
type Item = Cell & { value: string; id: number };

interface Props {
  subLevel: SubLevel;
  category: LevelCategory;
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

export const SnakeBoard = ({ subLevel, category, onExit, onFinish }: Props) => {
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
      // Show only the current target on the board (one item at a time)
      const v = subLevel.sequence[nextIdx];
      if (v !== undefined) tryPlace(v);
      setItems(placed);
    },
    [subLevel]
  );

  // initial spawn + speak the first target
  useEffect(() => {
    spawnItems(snake, 0);
    const first = subLevel.sequence[0];
    if (first !== undefined) {
      // small delay so voices are loaded
      setTimeout(() => speech.speak(first, category), 250);
    }
    return () => speech.cancel();
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
            // Speak the value the snake just ate
            speech.speak(hit.value, category);
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
            // Speak next target shortly after
            const nextVal = subLevel.sequence[nextIdx];
            if (nextVal !== undefined) {
              setTimeout(() => speech.speak(nextVal, category), 700);
            }
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
          "relative w-full max-w-md aspect-[14/18] rounded-[var(--radius)] overflow-hidden border-4 border-primary/30",
          shake && "animate-shake"
        )}
        style={{
          backgroundImage: `url(${gardenBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          touchAction: "none",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* subtle overlay for contrast */}
        <div className="absolute inset-0 bg-background/10 pointer-events-none" />
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
        {snake.map((s, i) => {
          const isHead = i === 0;
          const isTail = i === snake.length - 1;
          const rot = dir === "up" ? -90 : dir === "down" ? 90 : dir === "left" ? 180 : 0;
          // alternating scale pattern for realism
          const scaleShade = i % 2 === 0 ? "var(--snake-body)" : "var(--snake-head)";
          return (
            <div
              key={i}
              className="absolute transition-[left,top] duration-100"
              style={{
                left: `${s.x * cellPx}%`,
                top: `${s.y * cellPxY}%`,
                width: `${cellPx}%`,
                height: `${cellPxY}%`,
                zIndex: isHead ? 30 : 20 - Math.min(i, 18),
              }}
            >
              {isHead ? (
                <div
                  className="w-full h-full relative"
                  style={{ transform: `rotate(${rot}deg) scale(1.35)`, transformOrigin: "center" }}
                >
                  {/* cobra hood */}
                  <div
                    className="absolute"
                    style={{
                      left: "-15%",
                      top: "10%",
                      width: "70%",
                      height: "80%",
                      background: `radial-gradient(ellipse at center, hsl(145 75% 40%) 0%, hsl(145 80% 28%) 100%)`,
                      borderRadius: "60% 30% 60% 30%",
                      boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.35)",
                    }}
                  />
                  {/* head shape (oval) */}
                  <div
                    className="absolute"
                    style={{
                      left: "25%",
                      top: "15%",
                      width: "75%",
                      height: "70%",
                      background:
                        "radial-gradient(circle at 70% 35%, hsl(145 85% 55%) 0%, hsl(145 80% 32%) 100%)",
                      borderRadius: "55% 70% 55% 70%",
                      boxShadow:
                        "0 0 10px hsl(var(--primary-glow) / 0.6), inset -3px -3px 6px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.2)",
                    }}
                  />
                  {/* hood pattern (cobra mark) */}
                  <span
                    className="absolute"
                    style={{
                      left: "0%",
                      top: "38%",
                      width: "35%",
                      height: "24%",
                      background: "hsl(45 90% 55%)",
                      borderRadius: "50%",
                      opacity: 0.85,
                    }}
                  />
                  {/* eyes */}
                  <span className="absolute top-[22%] right-[18%] w-[18%] h-[18%] rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="w-[55%] h-[80%] rounded-full bg-black" />
                  </span>
                  <span className="absolute bottom-[22%] right-[18%] w-[18%] h-[18%] rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="w-[55%] h-[80%] rounded-full bg-black" />
                  </span>
                  {/* forked tongue */}
                  <span
                    className="absolute top-1/2 -right-[35%] w-[40%] h-[12%] -translate-y-1/2 animate-pulse"
                    style={{
                      background: "hsl(0 85% 55%)",
                      clipPath: "polygon(0 35%, 60% 35%, 60% 0, 100% 50%, 60% 100%, 60% 65%, 0 65%)",
                    }}
                  />
                </div>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, hsl(${scaleShade}) 0%, hsl(var(--snake-head)) 100%)`,
                    borderRadius: isTail ? "50% 50% 50% 50% / 60% 60% 50% 50%" : "45%",
                    boxShadow:
                      "inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 3px rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.2)",
                    transform: isTail ? "scale(0.85)" : "scale(1.05)",
                  }}
                >
                  {/* belly scale stripe */}
                  <span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: "55%",
                      height: "55%",
                      background:
                        "linear-gradient(135deg, hsl(45 90% 65% / 0.45), transparent 70%)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

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
