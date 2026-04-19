import { useNavigate } from "react-router-dom";
import { LEVELS } from "@/game/levels";
import { loadProgress } from "@/game/storage";
import { sounds } from "@/game/sounds";
import schoolHero from "@/assets/school-hero.jpg";

const Home = () => {
  const navigate = useNavigate();
  const progress = loadProgress();
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);

  const go = (id: string) => {
    sounds.resume();
    sounds.tap();
    navigate(`/levels/${id}`);
  };

  return (
    <div className="min-h-screen gradient-sky flex flex-col items-center px-4 py-6">
      <header className="w-full max-w-md text-center mb-5 animate-fade-in">
        <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-primary/30 mb-4">
          <img
            src={schoolHero}
            alt="Happy children walking to school on a sunny morning"
            width={1536}
            height={1024}
            className="w-full h-auto block"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          🐍 Smart Snake
        </h1>
        <p className="text-muted-foreground font-semibold">Kids Learning Game</p>
      </header>

      <div className="kid-card w-full max-w-md p-4 mb-5 flex items-center justify-between animate-scale-in">
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase">Your Stars</div>
          <div className="text-2xl font-extrabold text-warning">⭐ {totalStars}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase">Stickers</div>
          <div className="text-2xl font-extrabold text-accent">🏅 {progress.stickers.length}</div>
        </div>
      </div>

      <div className="w-full max-w-md grid gap-4">
        {LEVELS.map((lvl, i) => (
          <button
            key={lvl.id}
            onClick={() => go(lvl.id)}
            className="kid-btn p-5 text-left flex items-center gap-4 bg-card animate-scale-in"
            style={{ animationDelay: `${i * 80}ms` }}
            aria-label={`Play ${lvl.title}`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl ${lvl.color}`}>
              {lvl.emoji}
            </div>
            <div className="flex-1">
              <div className="text-xl font-extrabold">{lvl.title}</div>
              <div className="text-sm text-muted-foreground">
                {lvl.subLevels.length} levels
              </div>
            </div>
            <span className="text-2xl">▶</span>
          </button>
        ))}
      </div>

      <footer className="mt-auto pt-8 text-xs text-muted-foreground">
        Made with ❤️ for little learners
      </footer>
    </div>
  );
};

export default Home;
