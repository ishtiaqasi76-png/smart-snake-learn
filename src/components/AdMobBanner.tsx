import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { prepareInterstitial, showInterstitial } from "@/game/interstitial";

/**
 * Unity Ads does NOT support banner ads (only interstitial & rewarded).
 * To still earn from this slot, we trigger an interstitial periodically.
 * On web (Lovable preview / PWA), this is a no-op.
 */
const AdMobBanner = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Pre-load on mount
    void prepareInterstitial();

    // Show an interstitial every 3 minutes while the app is open
    const interval = setInterval(() => {
      void showInterstitial();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default AdMobBanner;
