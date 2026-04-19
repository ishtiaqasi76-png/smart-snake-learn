export type LevelCategory = "counting" | "abc" | "urdu";

export interface SubLevel {
  id: string;
  title: string;
  subtitle?: string;
  sequence: string[];
  speedMs: number; // snake move tick
  itemsOnBoard: number; // how many candidates to show simultaneously
  fontClass?: string;
}

export interface Level {
  id: LevelCategory;
  title: string;
  emoji: string;
  color: string; // tailwind bg class
  subLevels: SubLevel[];
}

const range = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => String(a + i));

const ALPHA_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALPHA_LOWER = "abcdefghijklmnopqrstuvwxyz".split("");
const URDU = [
  "ا","ب","پ","ت","ٹ","ث","ج","چ","ح","خ","د","ڈ","ذ","ر","ڑ","ز","ژ",
  "س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ک","گ","ل","م","ن","و","ہ","ی","ے",
];

export const LEVELS: Level[] = [
  {
    id: "counting",
    title: "Counting",
    emoji: "🔢",
    color: "bg-secondary",
    subLevels: [
      { id: "c1", title: "1 to 20", sequence: range(1, 20), speedMs: 260, itemsOnBoard: 4 },
      { id: "c2", title: "1 to 50", sequence: range(1, 50), speedMs: 220, itemsOnBoard: 5 },
      { id: "c3", title: "1 to 100", sequence: range(1, 100), speedMs: 180, itemsOnBoard: 6 },
    ],
  },
  {
    id: "abc",
    title: "Alphabets",
    emoji: "🔤",
    color: "bg-accent",
    subLevels: [
      { id: "a1", title: "A to Z", subtitle: "Uppercase", sequence: ALPHA_UPPER, speedMs: 240, itemsOnBoard: 5 },
      { id: "a2", title: "a to z", subtitle: "Lowercase", sequence: ALPHA_LOWER, speedMs: 220, itemsOnBoard: 5 },
      { id: "a3", title: "Mixed", subtitle: "Aa Bb Cc...", sequence: ALPHA_UPPER.flatMap((u, i) => [u, ALPHA_LOWER[i]]), speedMs: 200, itemsOnBoard: 6 },
    ],
  },
  {
    id: "urdu",
    title: "Urdu",
    emoji: "🇵🇰",
    color: "bg-primary",
    subLevels: [
      { id: "u1", title: "ا سے ے", subtitle: "Basic", sequence: URDU, speedMs: 260, itemsOnBoard: 5, fontClass: "urdu" },
      { id: "u2", title: "آوازوں کے ساتھ", subtitle: "With sounds", sequence: URDU, speedMs: 240, itemsOnBoard: 5, fontClass: "urdu" },
      { id: "u3", title: "Revision", subtitle: "Mixed", sequence: URDU, speedMs: 200, itemsOnBoard: 6, fontClass: "urdu" },
    ],
  },
];

export const findSubLevel = (cat: LevelCategory, subId: string) => {
  const lvl = LEVELS.find((l) => l.id === cat);
  return { level: lvl, subLevel: lvl?.subLevels.find((s) => s.id === subId) };
};
