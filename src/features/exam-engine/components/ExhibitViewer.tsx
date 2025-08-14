import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Dimensions,
  Image,
  Alert
} from 'react-native';

interface ExhibitViewerProps {
  exhibits: string[];
  visible: boolean;
  onClose: () => void;
  currentExhibitIndex?: number;
}

const ExhibitViewer: React.FC<ExhibitViewerProps> = ({
  exhibits,
  visible,
  onClose,
  currentExhibitIndex = 0
}) => {
  const [activeIndex, setActiveIndex] = useState(currentExhibitIndex);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
    Alert.alert('Image Error', 'Failed to load exhibit image');
  };

  const navigateExhibit = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (direction === 'next' && activeIndex < exhibits.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const renderExhibitTabs = () => {
    if (exhibits.length <= 1) return null;

    return (
      <View style={styles.tabContainer}>
        {exhibits.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tab,
              activeIndex === index && styles.activeTab
            ]}
            onPress={() => setActiveIndex(index)}
          >
            <Text style={[
              styles.tabText,
              activeIndex === index && styles.activeTabText
            ]}>
              Exhibit {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderExhibitContent = () => {
    const currentExhibit = exhibits[activeIndex];
    
    if (imageError[activeIndex]) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>📷</Text>
          <Text style={styles.errorMessage}>
            Unable to load exhibit {activeIndex + 1}
          </Text>
          <Text style={styles.errorPath}>{currentExhibit}</Text>
        </View>
      );
    }

    // Check if it's a web URL or local path
    const isWebUrl = currentExhibit.startsWith('http://') || currentExhibit.startsWith('https://');
    const imageSource = isWebUrl 
      ? { uri: currentExhibit }
      : { uri: currentExhibit }; // For local files, React Native will handle the path

    return (
      <ScrollView
        style={styles.imageContainer}
        contentContainerStyle={styles.imageScrollContent}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        maximumZoomScale={3}
        minimumZoomScale={1}
        pinchGestureEnabled={true}
      >
        <Image
          source={imageSource}
          style={[
            styles.exhibitImage,
            {
              width: screenWidth - 40,
              height: screenHeight - 200, // Account for header and tabs
            }
          ]}
          resizeMode="contain"
          onError={() => handleImageError(activeIndex)}
        />
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              Exhibit {activeIndex + 1} of {exhibits.length}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {exhibits.length > 1 && (
              <>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    activeIndex === 0 && styles.disabledButton
                  ]}
                  onPress={() => navigateExhibit('prev')}
                  disabled={activeIndex === 0}
                >
                  <Text style={styles.navButtonText}>‹ Prev</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    activeIndex === exhibits.length - 1 && styles.disabledButton
                  ]}
                  onPress={() => navigateExhibit('next')}
                  disabled={activeIndex === exhibits.length - 1}
                >
                  <Text style={styles.navButtonText}>Next ›</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exhibit Tabs */}
        {renderExhibitTabs()}

        {/* Exhibit Content */}
        <View style={styles.contentContainer}>
          {renderExhibitContent()}
        </View>

        {/* Footer Instructions */}
        <View style={styles.footer}>
          <Text style={styles.instructionText}>
            📱 Pinch to zoom • 👆 Scroll to pan • 📑 Tap tabs to switch exhibits
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    backgroundColor: '#2B5CE6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeTab: {
    backgroundColor: '#2B5CE6',
    borderColor: '#2B5CE6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exhibitImage: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorPath: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  instructionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ExhibitViewer;