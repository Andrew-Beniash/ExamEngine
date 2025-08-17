import { Platform } from 'react-native';
import Config from 'react-native-config';

export const AD_UNIT_IDS = {
  banner: {
    ios: Config.ADMOB_BANNER_IOS || 'ca-app-pub-3940256099942544/2934735716', // Test ID
    android: Config.ADMOB_BANNER_ANDROID || 'ca-app-pub-3940256099942544/6300978111', // Test ID
  },
  interstitial: {
    ios: Config.ADMOB_INTERSTITIAL_IOS || 'ca-app-pub-3940256099942544/4411468910', // Test ID
    android: Config.ADMOB_INTERSTITIAL_ANDROID || 'ca-app-pub-3940256099942544/1033173712', // Test ID
  },
  native: {
    ios: Config.ADMOB_NATIVE_IOS || 'ca-app-pub-3940256099942544/3986624511', // Test ID
    android: Config.ADMOB_NATIVE_ANDROID || 'ca-app-pub-3940256099942544/2247696110', // Test ID
  },
};

export const getBannerAdUnitId = () => {
  return Platform.OS === 'ios' ? AD_UNIT_IDS.banner.ios : AD_UNIT_IDS.banner.android;
};

export const getInterstitialAdUnitId = () => {
  return Platform.OS === 'ios' ? AD_UNIT_IDS.interstitial.ios : AD_UNIT_IDS.interstitial.android;
};

export const getNativeAdUnitId = () => {
  return Platform.OS === 'ios' ? AD_UNIT_IDS.native.ios : AD_UNIT_IDS.native.android;
};

export const AD_GUARDRAILS = {
  // Never show interstitial during active question answering
  MIN_TIME_BETWEEN_INTERSTITIALS: 10 * 60 * 1000, // 10 minutes
  NO_ADS_IN_FINAL_MINUTES: 5, // No ads in final 5 minutes of timed exams
  MAX_INTERSTITIALS_PER_SESSION: 3,
  SHOW_INTERSTITIAL_AFTER_QUESTIONS: 10, // Show after every 10 questions
};

export const AD_EVENTS = {
  BANNER_LOADED: 'ad_banner_loaded',
  BANNER_FAILED: 'ad_banner_failed',
  INTERSTITIAL_LOADED: 'ad_interstitial_loaded',
  INTERSTITIAL_FAILED: 'ad_interstitial_failed',
  INTERSTITIAL_SHOWN: 'ad_interstitial_shown',
  INTERSTITIAL_CLICKED: 'ad_interstitial_clicked',
  AD_REVENUE: 'ad_revenue',
} as const;