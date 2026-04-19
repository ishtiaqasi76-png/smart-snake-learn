import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  AdLoadInfo,
  AdMobError,
  InterstitialAdPluginEvents,
} from "@capacitor-community/admob";

const INTERSTITIAL_AD_ID = "ca-app-pub-9193011598064450/6325547458";

let isPrepared = false;
let isPreparing = false;
let listenersAttached = false;

const attachListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;
  AdMob.addListener(InterstitialAdPluginEvents.Loaded, (_info: AdLoadInfo) => {
    isPrepared = true;
    isPreparing = false;
  });
  AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (e: AdMobError) => {
    console.warn("Interstitial failed to load", e);
    isPrepared = false;
    isPreparing = false;
  });
  AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    isPrepared = false;
    // Pre-load the next one
    void prepareInterstitial();
  });
};

export const prepareInterstitial = async () => {
  if (!Capacitor.isNativePlatform()) return;
  if (isPrepared || isPreparing) return;
  attachListeners();
  isPreparing = true;
  try {
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_ID,
      isTesting: false,
    });
  } catch (err) {
    isPreparing = false;
    console.warn("prepareInterstitial failed", err);
  }
};

export const showInterstitial = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!isPrepared) {
      await prepareInterstitial();
      // Give it a brief moment to load, then bail if not ready
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (isPrepared) {
      await AdMob.showInterstitial();
      isPrepared = false;
    }
  } catch (err) {
    console.warn("showInterstitial failed", err);
  }
};
