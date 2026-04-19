import { useNavigate, useParams } from "react-router-dom";
import { LEVELS } from "@/game/levels";
import { loadProgress } from "@/game/storage";
import { Star } from "@/components/Star";
import { sounds } from "@/game/sounds";

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
              className="kid-btn bg-card p-5 text-left flex items-center gap-4 animate-scale-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden ${level.color}`}>
                <img
                  src={level.image}
                  alt={`${level.title} illustration`}
                  width={64}
                  height={64}
                  loading="lazy"
                  className="w-full h-full object-contain p-1"
                />
                <span className="absolute bottom-0 right-0 bg-card text-foreground text-xs font-extrabold rounded-tl-lg px-1.5 py-0.5 shadow">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className={`text-xl font-extrabold ${sub.fontClass ?? ""}`}>{sub.title}</div>
                {sub.subtitle && <div className="text-sm text-muted-foreground">{sub.subtitle}</div>}
              </div>
              <div className="flex gap-0.5 text-2xl">
                {[1, 2, 3].map((n) => (
                  <Star key={n} filled={stars >= n} className="!text-2xl" />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelect;
