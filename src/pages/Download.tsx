import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

// 👇 YAHAN apna GitHub username daalein (repo ka naam: smart-snake-learn)
// Misal: agar username "ahmed123" hai to:
// https://github.com/ahmed123/smart-snake-learn/releases/latest/download/smart-snake-learn.apk
const GITHUB_USERNAME = "ishtiaqasi76-png";
const APK_DOWNLOAD_URL = `https://github.com/${GITHUB_USERNAME}/smart-snake-learn/releases/latest/download/smart-snake-learn.apk`;

const Download = () => {
  const navigate = useNavigate();

  const handleDownload = () => {
    window.location.href = APK_DOWNLOAD_URL;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-background to-secondary/30">
      <div className="kid-card w-full max-w-md p-8 text-center bg-card/95 backdrop-blur animate-scale-in">
        <div className="text-6xl mb-4">📱</div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          Smart Snake APK
        </h1>
        <p className="text-muted-foreground font-semibold mb-6">
          Apne Android phone par install karein aur seekhna shuru karein!
        </p>

        <button
          onClick={handleDownload}
          className="kid-btn w-full bg-primary text-primary-foreground text-xl font-extrabold py-4 mb-4 hover:bg-primary/90 transition-colors"
          aria-label="Download APK"
        >
          ⬇️ Download APK
        </button>

        <div className="bg-card border-2 border-border rounded-2xl p-4 mb-4 flex flex-col items-center">
          <div className="font-bold text-foreground mb-2">📲 QR Code se download karein</div>
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG
              value={APK_DOWNLOAD_URL}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-muted-foreground font-semibold mt-2 text-center">
            Phone camera se scan karein
          </p>
        </div>

        <div className="text-left bg-muted/50 rounded-xl p-4 mb-4 text-sm">
          <div className="font-bold mb-2">📋 Install karne ka tareeqa:</div>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Upar wala button dabayein</li>
            <li>APK file download hone dein</li>
            <li>Phone Settings → "Unknown sources" allow karein</li>
            <li>Downloaded file par tap karke install karein</li>
          </ol>
        </div>

        <button
          onClick={() => navigate("/")}
          className="text-primary font-bold underline"
        >
          ← Home par wapas jayein
        </button>
      </div>
    </div>
  );
};

export default Download;
