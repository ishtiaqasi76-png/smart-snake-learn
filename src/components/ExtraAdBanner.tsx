import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { prepareInterstitial } from "@/game/interstitial";

/**
 * Unity Ads has no banner support. This component now just pre-loads
 * an interstitial so it's ready when a page transition triggers it.
 */
const ExtraAdBanner = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void prepareInterstitial();
  }, []);

  return null;
};

export default ExtraAdBanner;
