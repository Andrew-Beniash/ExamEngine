import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { getBannerAdUnitId, AD_EVENTS } from '../../../config/ads';
import { SecureStorage } from '../../../data/storage/SecureStorage';

interface BannerAdComponentProps {
  size?: BannerAdSize;
  style?: object;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: any) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  size = BannerAdSize.ADAPTIVE_BANNER,
  style,
  onAdLoaded,
  onAdFailedToLoad,
}) => {
  const [isAdsRemoved, setIsAdsRemoved] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const storage = SecureStorage.getInstance();

  useEffect(() => {
    // Check if user has removed ads (IAP)
    const checkAdsRemoved = () => {
      try {
        const adState = storage.getAdState();
        if (adState) {
          setIsAdsRemoved(adState.adsRemoved || false);
        }
      } catch (error) {
        console.warn('Failed to check ads removed state:', error);
      }
    };

    checkAdsRemoved();
  }, [storage]);

  const handleAdLoaded = () => {
    console.log('Banner ad loaded successfully');
    setAdError(null);
    onAdLoaded?.();
    trackAdEvent(AD_EVENTS.BANNER_LOADED);
  };

  const handleAdFailedToLoad = (error: any) => {
    console.warn('Banner ad failed to load:', error);
    setAdError(error.message || 'Unknown error');
    onAdFailedToLoad?.(error);
    trackAdEvent(AD_EVENTS.BANNER_FAILED, { error: error.message });
  };

  const trackAdEvent = (event: string, params?: Record<string, any>) => {
    // This will integrate with your analytics system
    console.log('Banner Ad Event:', event, params);
    // TODO: Send to Firebase Analytics
    // analytics.track(event, params);
  };

  // Don't render if ads are removed or there's a persistent error
  if (isAdsRemoved || adError) {
    return null;
  }

  const adUnitId = __DEV__ ? TestIds.BANNER : getBannerAdUnitId();

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

// Smart Banner Component that chooses appropriate size
export const SmartBannerAd: React.FC<Omit<BannerAdComponentProps, 'size'>> = (props) => {
  const getOptimalBannerSize = (): BannerAdSize => {
    if (screenWidth >= 728) {
      return BannerAdSize.LEADERBOARD; // 728x90
    } else if (screenWidth >= 468) {
      return BannerAdSize.BANNER; // 320x50
    } else if (screenWidth >= 320) {
      return BannerAdSize.ADAPTIVE_BANNER; // Adaptive
    }
    return BannerAdSize.BANNER; // Fallback
  };

  return <BannerAdComponent {...props} size={getOptimalBannerSize()} />;
};

// Question Screen Banner (smaller, less intrusive)
export const QuestionBannerAd: React.FC<BannerAdComponentProps> = (props) => {
  return (
    <BannerAdComponent 
      {...props} 
      size={BannerAdSize.BANNER}
      style={[styles.questionBanner, props.style]}
    />
  );
};

// Tips Screen Banner (medium size)
export const TipsBannerAd: React.FC<BannerAdComponentProps> = (props) => {
  return (
    <BannerAdComponent 
      {...props} 
      size={BannerAdSize.MEDIUM_RECTANGLE}
      style={[styles.tipsBanner, props.style]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
  },
  questionBanner: {
    marginVertical: 4,
  },
  tipsBanner: {
    marginVertical: 8,
    paddingVertical: 12,
  },
});

export default BannerAdComponent;