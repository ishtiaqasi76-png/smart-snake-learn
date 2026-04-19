import { useNavigate, useParams } from "react-router-dom";
import { LEVELS } from "@/game/levels";
import { loadProgress } from "@/game/storage";
import { Star } from "@/components/Star";
import { sounds } from "@/game/sounds";
import ExtraAdBanner from "@/components/ExtraAdBanner";

const LevelSelect = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const level = LEVELS.find((l) => l.id === category);
  const progress = loadProgress();

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button className="kid-btn bg-card px-4 py-2" onClick={() => navigate("/")}>← Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-sky px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-md flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/")} className="kid-btn bg-card px-4 py-2">←</button>
        <h2 className="text-2xl font-extrabold flex items-center gap-2">
          <img
            src={level.image}
            alt={`${level.title} icon`}
            width={48}
            height={48}
            className="w-12 h-12 object-contain"
          />
          {level.title}
        </h2>
      </div>

      <div className="w-full max-w-md grid gap-4">
        {level.subLevels.map((sub, i) => {
          const stars = progress.stars[sub.id] ?? 0;
          return (
            <button
              key={sub.id}
              onClick={() => { sounds.tap(); navigate(`/play/${level.id}/${sub.id}`); }}
              className="kid-btn relative overflow-hidden text-left bg-card animate-scale-in h-32"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Full-button background image */}
              <img
                src={level.image}
                alt={`${level.title} illustration`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Readability overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-background/10" />

              {/* Foreground content */}
              <div className="relative z-10 h-full flex items-center gap-4 p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold ${level.color} text-primary-foreground shadow`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className={`text-xl font-extrabold drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] ${sub.fontClass ?? ""}`}>
                    {sub.title}
                  </div>
                  {sub.subtitle && (
                    <div className="text-sm text-foreground/80 font-semibold">{sub.subtitle}</div>
                  )}
                </div>
                <div className="flex gap-0.5 text-2xl bg-card/80 rounded-full px-2 py-1 shadow">
                  {[1, 2, 3].map((n) => (
                    <Star key={n} filled={stars >= n} className="!text-2xl" />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelect;
