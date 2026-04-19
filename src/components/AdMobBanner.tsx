import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from "@capacitor-community/admob";

const BANNER_AD_ID = "ca-app-pub-9193011598064450/9199122802";
const REFRESH_INTERVAL_MS = 20_000;

/**
 * AdMob banner that shows on every page in the native Android/iOS build
 * and auto-refreshes every 20 seconds. On web (Lovable preview / PWA),
 * AdMob is unsupported so this component renders nothing.
 */
const AdMobBanner = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const showBanner = async () => {
      try {
        await AdMob.showBanner({
          adId: BANNER_AD_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false,
        });
      } catch (err) {
        console.warn("AdMob showBanner failed", err);
      }
    };

    const refreshBanner = async () => {
      try {
        await AdMob.removeBanner();
      } catch {
        // ignore
      }
      if (!cancelled) await showBanner();
    };

    (async () => {
      try {
        await AdMob.initialize({ initializeForTesting: false });
        AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (e) =>
          console.warn("Banner failed:", e)
        );
        await showBanner();
        interval = setInterval(refreshBanner, REFRESH_INTERVAL_MS);
      } catch (err) {
        console.warn("AdMob init failed", err);
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      AdMob.removeBanner().catch(() => {});
    };
  }, []);

  return null;
};

export default AdMobBanner;
