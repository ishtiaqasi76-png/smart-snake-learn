import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.887536531ab341389d5e0a8cd30eac92",
  appName: "smart-snake-learn",
  webDir: "dist",
  server: {
    url: "https://88753653-1ab3-4138-9d5e-0a8cd30eac92.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    AdMob: {
      appId: "ca-app-pub-9193011598064450~0000000000",
    },
  },
};

export default config;
