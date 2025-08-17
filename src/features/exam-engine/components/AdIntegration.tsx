import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { QuestionBannerAd } from '../../ads/components/BannerAd';
import { AdManager } from '../../ads/AdManager';
import { useExamSession } from '../../../shared/hooks';

interface AdIntegrationProps {
  _onQuestionAnswered?: () => void;
  questionsAnswered: number;

}

export const ExamAdManager: React.FC<AdIntegrationProps> = ({
  _onQuestionAnswered,
  questionsAnswered,
}) => {
  const examSession = useExamSession();
  const adManager = AdManager.getInstance();



  useEffect(() => {
    // Reset session counts when exam starts
    if (examSession.isActive && questionsAnswered === 0) {
      adManager.resetSessionCounts();
    }
  }, [examSession.isActive, questionsAnswered, adManager]);

  return null; // This is a logic-only component
};

// Banner ad for question screens
export const QuestionScreenBanner: React.FC = () => {
  const handleAdLoaded = () => {
    console.log('Question screen banner ad loaded');
  };

  const handleAdError = (error: any) => {
    console.warn('Question screen banner failed:', error);
  };

  return (
    <QuestionBannerAd
      onAdLoaded={handleAdLoaded}
      onAdFailedToLoad={handleAdError}
    />
  );
};

// Interstitial trigger for section completion
export const SectionCompletionAd: React.FC<{
  sectionName: string;
  onAdComplete?: () => void;
}> = ({ sectionName, onAdComplete }) => {
  const adManager = AdManager.getInstance();

  useEffect(() => {
    const showSectionAd = async () => {
      const canShow = adManager.canShowInterstitial({
        isExamActive: false, // Between sections
      });

      if (canShow) {
        Alert.alert(
          'Section Complete',
          `Great job completing the ${sectionName} section! `,
          [
            {
              text: 'Continue',
              onPress: async () => {
                await adManager.showInterstitial();
                onAdComplete?.();
              },
            },
          ]
        );
      } else {
        onAdComplete?.();
      }
    };

    showSectionAd();
  }, [adManager, sectionName, onAdComplete]);

  return null;
};

// Results screen interstitial
export const ResultsScreenAd: React.FC<{
  examScore: number;
  onAdComplete?: () => void;
}> = ({ examScore, onAdComplete }) => {
  const adManager = AdManager.getInstance();

  useEffect(() => {
    const showResultsAd = async () => {
      // Only show if exam is completed (not just ended early)
      const canShow = adManager.canShowInterstitial({
        isExamActive: false,
      });

      if (canShow) {
        // Wait a moment for user to see results first
        setTimeout(async () => {
          await adManager.showInterstitial();
          onAdComplete?.();
        }, 2000);
      } else {
        onAdComplete?.();
      }
    };

    showResultsAd();
  }, [adManager, examScore, onAdComplete]);

  return null;
};