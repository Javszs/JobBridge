import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'JobBridge',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,        // We control hiding manually
      androidScaleType: 'CENTER_CROP',
      // optional: backgroundColor: "#ffffffff",
      // showSpinner: false,
    },
  },
};

export default config;
