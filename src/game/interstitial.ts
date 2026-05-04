import { Capacitor, registerPlugin } from "@capacitor/core";

// ====== UNITY ADS CONFIG ======
// Replace these with your real values from Unity Dashboard:
// https://dashboard.unity3d.com → Monetization → your project
const UNITY_GAME_ID_ANDROID = "YOUR_ANDROID_GAME_ID"; // e.g. "5812345"
const UNITY_GAME_ID_IOS = "YOUR_IOS_GAME_ID";
const INTERSTITIAL_PLACEMENT_ID = "Interstitial_Android"; // default Unity placement
const TEST_MODE = false; // set true while testing
// ===============================

interface UnityAdsPlugin {
  initialize(options: { gameId: string; testMode?: boolean }): Promise<void>;
  loadInterstitial(options: { placementId: string }): Promise<void>;
  showInterstitial(): Promise<{ success: boolean }>;
  isInterstitialLoaded(): Promise<{ loaded: boolean }>;
}

const UnityAds = registerPlugin<UnityAdsPlugin>("UnityAds");

let isInitialized = false;
let isPrepared = false;
let isPreparing = false;

const initOnce = async () => {
  if (isInitialized) return;
  const gameId =
    Capacitor.getPlatform() === "ios"
      ? UNITY_GAME_ID_IOS
      : UNITY_GAME_ID_ANDROID;
  try {
    await UnityAds.initialize({ gameId, testMode: TEST_MODE });
    isInitialized = true;
  } catch (err) {
    console.warn("Unity Ads init failed", err);
  }
};

export const prepareInterstitial = async () => {
  if (!Capacitor.isNativePlatform()) return;
  if (isPrepared || isPreparing) return;
  isPreparing = true;
  try {
    await initOnce();
    await UnityAds.loadInterstitial({ placementId: INTERSTITIAL_PLACEMENT_ID });
    const { loaded } = await UnityAds.isInterstitialLoaded();
    isPrepared = loaded;
  } catch (err) {
    console.warn("Unity prepareInterstitial failed", err);
  } finally {
    isPreparing = false;
  }
};

export const showInterstitial = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!isPrepared) {
      await prepareInterstitial();
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (isPrepared) {
      await UnityAds.showInterstitial();
      isPrepared = false;
      // Pre-load next one
      void prepareInterstitial();
    }
  } catch (err) {
    console.warn("Unity showInterstitial failed", err);
  }
};
