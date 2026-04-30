import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.app887536531ab341389d5e0a8cd30eac92",
  appName: "smart-snake-learn",
  webDir: "dist",
  plugins: {
    AdMob: {
      appId: "ca-app-pub-9193011598064450~3152589200",
      appIdAndroid: "ca-app-pub-9193011598064450~3152589200",
      appIdIos: "ca-app-pub-9193011598064450~3152589200",
      initializeForTesting: false,
    },
  },
};

export default config;
