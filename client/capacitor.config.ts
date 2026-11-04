import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoattend.app',
  appName: 'GeoAttend',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  },
  // Register custom URL scheme for deep linking (OAuth callback)
  server: {
    hostname: 'geoattend.app',
    androidScheme: 'https'
  }
};

export default config;
