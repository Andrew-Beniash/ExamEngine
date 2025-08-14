import { useNavigation as useReactNavigation } from '@react-navigation/native';

export const useAppNavigation = () => {
  const navigation = useReactNavigation();
  
  const navigateToExam = () => {
    navigation.navigate('Exam' as never);
  };

  const navigateToHome = () => {
    navigation.navigate('Home' as never);
  };

  const navigateToResults = () => {
    // Could navigate to a results screen in the future
    navigation.navigate('Profile' as never);
  };

  return {
    navigateToExam,
    navigateToHome,
    navigateToResults,
  };
};