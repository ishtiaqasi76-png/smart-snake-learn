import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from "@capacitor-community/admob";

const EXTRA_AD_ID = "ca-app-pub-9193011598064450/3563652748";
const REFRESH_INTERVAL_MS = 20_000;

/**
 * Secondary AdMob banner anchored to the TOP of the screen.
 * Uses the "Native Advanced" unit ID as a banner slot, since the
 * Capacitor AdMob plugin does not support true Native Advanced ads.
 * Auto-refreshes every 30 seconds. No-op on web.
 */
const ExtraAdBanner = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const showBanner = async () => {
      try {
        await AdMob.showBanner({
          adId: EXTRA_AD_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 0,
          isTesting: false,
        });
      } catch (err) {
        console.warn("Extra banner showBanner failed", err);
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
          console.warn("Extra banner failed:", e)
        );
        await showBanner();
        interval = setInterval(refreshBanner, REFRESH_INTERVAL_MS);
      } catch (err) {
        console.warn("Extra banner init failed", err);
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

export default ExtraAdBanner;
