import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { SecureStorage } from '../../data/storage/SecureStorage';
import { AD_GUARDRAILS, getInterstitialAdUnitId, AD_EVENTS } from '../../config/ads';

interface AdState {
  lastInterstitialTime: number;
  interstitialsShownThisSession: number;
  sessionStartTime: number;
  totalQuestionsAnswered: number;
  adsRemoved: boolean; // For future IAP
}

export class AdManager {
  private static instance: AdManager;
  private interstitialAd: InterstitialAd | null = null;
  private isInterstitialLoaded = false;
  private adState: AdState;
  private storage: SecureStorage;

  private constructor() {
    this.storage = SecureStorage.getInstance();
    this.adState = this.loadAdState();
    this.initializeInterstitialAd();
  }

  public static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  private loadAdState(): AdState {
    const defaultState: AdState = {
      lastInterstitialTime: 0,
      interstitialsShownThisSession: 0,
      sessionStartTime: Date.now(),
      totalQuestionsAnswered: 0,
      adsRemoved: false,
    };

    try {
      const saved = this.storage.getAdState();
      if (saved) {
        return {
          ...defaultState,
          ...saved,
          sessionStartTime: Date.now(), // Always reset session start
          interstitialsShownThisSession: 0, // Reset per session
        };
      }
    } catch (error) {
      console.warn('Failed to load ad state:', error);
    }

    return defaultState;
  }

  private saveAdState(): void {
    try {
      this.storage.storeAdState(this.adState);
    } catch (error) {
      console.warn('Failed to save ad state:', error);
    }
  }

  private initializeInterstitialAd(): void {
    if (this.adState.adsRemoved) return;

    const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : getInterstitialAdUnitId();
    this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId);

    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial ad loaded');
      this.isInterstitialLoaded = true;
      this.trackAdEvent(AD_EVENTS.INTERSTITIAL_LOADED);
    });

    this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('Interstitial ad failed to load:', error);
      this.isInterstitialLoaded = false;
      this.trackAdEvent(AD_EVENTS.INTERSTITIAL_FAILED, { error: error.message });
    });

    this.interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
      console.log('Interstitial ad opened');
      this.trackAdEvent(AD_EVENTS.INTERSTITIAL_SHOWN);
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLICKED, () => {
      console.log('Interstitial ad clicked');
      this.trackAdEvent(AD_EVENTS.INTERSTITIAL_CLICKED);
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial ad closed');
      this.isInterstitialLoaded = false;
      this.preloadNextInterstitial();
    });

    // Preload first ad
    this.interstitialAd.load();
  }

  private preloadNextInterstitial(): void {
    if (this.adState.adsRemoved) return;
    
    // Reload ad for next time
    setTimeout(() => {
      this.interstitialAd?.load();
    }, 2000); // Wait 2 seconds before reloading
  }

  private trackAdEvent(event: string, params?: Record<string, any>): void {
    // This will integrate with your analytics system
    console.log('Ad Event:', event, params);
    // TODO: Send to Firebase Analytics
    // analytics.track(event, params);
  }

  public canShowInterstitial(examContext?: {
    isExamActive: boolean;
    timeRemainingMs?: number;
    questionsAnswered?: number;
  }): boolean {
    if (this.adState.adsRemoved) return false;
    if (!this.isInterstitialLoaded) return false;

    // Never show during active question answering
    if (examContext?.isExamActive) {
      // Don't show ads in final minutes of timed exam
      if (examContext.timeRemainingMs && 
          examContext.timeRemainingMs < AD_GUARDRAILS.NO_ADS_IN_FINAL_MINUTES * 60 * 1000) {
        return false;
      }
    }

    // Check frequency caps
    const timeSinceLastAd = Date.now() - this.adState.lastInterstitialTime;
    if (timeSinceLastAd < AD_GUARDRAILS.MIN_TIME_BETWEEN_INTERSTITIALS) {
      return false;
    }

    // Check session limits
    if (this.adState.interstitialsShownThisSession >= AD_GUARDRAILS.MAX_INTERSTITIALS_PER_SESSION) {
      return false;
    }

    return true;
  }

  public shouldShowInterstitialAfterQuestions(questionsAnswered: number): boolean {
    if (!this.canShowInterstitial()) return false;
    
    return questionsAnswered > 0 && 
           questionsAnswered % AD_GUARDRAILS.SHOW_INTERSTITIAL_AFTER_QUESTIONS === 0;
  }

  public async showInterstitial(): Promise<boolean> {
    if (!this.canShowInterstitial()) {
      console.log('Cannot show interstitial: guardrails prevented');
      return false;
    }

    if (!this.interstitialAd || !this.isInterstitialLoaded) {
      console.log('Cannot show interstitial: ad not loaded');
      return false;
    }

    try {
      await this.interstitialAd.show();
      
      // Update state
      this.adState.lastInterstitialTime = Date.now();
      this.adState.interstitialsShownThisSession++;
      this.saveAdState();
      
      return true;
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      return false;
    }
  }

  public onQuestionAnswered(): void {
    this.adState.totalQuestionsAnswered++;
    this.saveAdState();
  }

  public setAdsRemoved(removed: boolean): void {
    this.adState.adsRemoved = removed;
    this.saveAdState();
    
    if (removed && this.interstitialAd) {
      // Clean up ad instances
      this.interstitialAd = null;
      this.isInterstitialLoaded = false;
    } else if (!removed && !this.interstitialAd) {
      // Re-initialize ads
      this.initializeInterstitialAd();
    }
  }

  public getAdState(): Readonly<AdState> {
    return { ...this.adState };
  }

  public resetSessionCounts(): void {
    this.adState.sessionStartTime = Date.now();
    this.adState.interstitialsShownThisSession = 0;
    this.saveAdState();
  }
}