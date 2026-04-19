const KEY = "smart-snake-progress-v1";

export interface Progress {
  // subLevelId -> stars (0-3)
  stars: Record<string, number>;
  stickers: string[];
}

const empty: Progress = { stars: {}, stickers: [] };

export const loadProgress = (): Progress => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
};

export const saveStars = (subLevelId: string, stars: number) => {
  const p = loadProgress();
  const prev = p.stars[subLevelId] ?? 0;
  p.stars[subLevelId] = Math.max(prev, stars);
  localStorage.setItem(KEY, JSON.stringify(p));
  return p;
};

export const unlockSticker = (sticker: string) => {
  const p = loadProgress();
  if (!p.stickers.includes(sticker)) p.stickers.push(sticker);
  localStorage.setItem(KEY, JSON.stringify(p));
  return p;
};
