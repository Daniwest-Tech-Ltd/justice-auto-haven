import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.justice.ultimateautomobiles',
  appName: 'Justice Ultimate Automobiles',
  webDir: 'dist',
  plugins: {
    DeepLinks: {
      schemes: ['com.justice.ultimateautomobiles']
    }
  }
};

export default config;