import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { findSubLevel, LevelCategory } from "@/game/levels";
import { SnakeBoard } from "@/components/SnakeBoard";
import { saveStars, unlockSticker } from "@/game/storage";
import { Star } from "@/components/Star";
import { sounds } from "@/game/sounds";
import { prepareInterstitial, showInterstitial } from "@/game/interstitial";
import ExtraAdBanner from "@/components/ExtraAdBanner";

const STICKERS = ["🦄", "🌟", "🦖", "🐼", "🚀", "🍩", "🐙", "🦋", "🍉"];

const Play = () => {
  const { category, subId } = useParams();
  const navigate = useNavigate();
  const { level, subLevel } = findSubLevel(category as LevelCategory, subId ?? "");

  const [result, setResult] = useState<null | { stars: number; correct: number; wrong: number; sticker?: string }>(null);

  // Pre-load an interstitial as soon as a level starts so it's ready on finish
  useEffect(() => {
    void prepareInterstitial();
  }, []);

  if (!level || !subLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button className="kid-btn bg-card px-4 py-2" onClick={() => navigate("/")}>← Home</button>
      </div>
    );
  }

  const handleFinish = ({ correct, wrong }: { correct: number; wrong: number; completed: boolean }) => {
    let stars = 1;
    if (wrong <= 2) stars = 2;
    if (wrong === 0) stars = 3;
    saveStars(subLevel.id, stars);
    let sticker: string | undefined;
    if (stars === 3) {
      sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)];
      unlockSticker(sticker);
    }
    setResult({ stars, correct, wrong, sticker });
    // Show interstitial after the result screen appears
    void showInterstitial();
  };

  if (result) {
    return (
      <div className="min-h-screen gradient-sky flex items-center justify-center px-4">
        <div className="kid-card p-8 max-w-sm w-full text-center animate-scale-in">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-2xl font-extrabold mb-2">Great job!</h2>
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3].map((n) => (
              <Star key={n} filled={result.stars >= n} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-success/10 rounded-xl p-3">
              <div className="text-xs text-muted-foreground font-bold">Correct</div>
              <div className="text-2xl font-extrabold text-success">{result.correct}</div>
            </div>
            <div className="bg-destructive/10 rounded-xl p-3">
              <div className="text-xs text-muted-foreground font-bold">Mistakes</div>
              <div className="text-2xl font-extrabold text-destructive">{result.wrong}</div>
            </div>
          </div>
          {result.sticker && (
            <div className="mb-4 animate-star-burst">
              <div className="text-xs text-muted-foreground font-bold">New Sticker!</div>
              <div className="text-5xl">{result.sticker}</div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { sounds.tap(); navigate(`/levels/${level.id}`); }}
              className="kid-btn bg-card px-4 py-3 flex-1 font-bold"
            >
              Levels
            </button>
            <button
              onClick={() => { sounds.tap(); setResult(null); window.location.reload(); }}
              className="kid-btn gradient-primary text-primary-foreground px-4 py-3 flex-1 font-extrabold"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-sky">
      <ExtraAdBanner />
      <SnakeBoard
        subLevel={subLevel}
        category={level.id}
        onFinish={handleFinish}
        onExit={() => navigate(`/levels/${level.id}`)}
      />
    </div>
  );
};

export default Play;
