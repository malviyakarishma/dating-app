import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, SafeAreaView, Platform, Animated, Easing } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    type: 'welcome',
    videoSource: require('../../assets/videos/video1.mp4'),
  },
  {
    id: '2',
    type: 'action',
    videoSource: require('../../assets/videos/video2.mp4'),
  }
];

const VideoSlide = ({ item, width, height, isActive, navigation }) => {
  const player = useVideoPlayer(item.videoSource, player => {
    player.loop = true;
    player.muted = false; // We want to hear the sound
  });

  // Handle play/pause based on active state so audio doesn't overlap
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  // Built-in Animated values
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (isActive) {
      // Animate In
      if (item.type === 'action') {
        Animated.parallel([
          Animated.timing(buttonOpacity, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
          Animated.timing(buttonTranslateY, { toValue: 0, duration: 800, delay: 300, easing: Easing.out(Easing.ease), useNativeDriver: true })
        ]).start();
      }
    } else {
      // Reset when inactive
      buttonOpacity.setValue(0);
      buttonTranslateY.setValue(50);
    }
  }, [isActive, item.type]);

  return (
    <View style={[styles.slide, { width }]}>
      <VideoView 
        player={player} 
        style={[styles.video, { width, height }]} 
        nativeControls={false}
        contentFit="cover"
      />
      
      {/* Dark overlay to make text more readable */}
      <View style={styles.overlay} />

      {item.type === 'action' && (
        <Animated.View style={[styles.actionContainer, { opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }] }]}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.replace('SignIn')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      <FlatList
        data={SLIDES}
        renderItem={({ item, index }) => (
          <VideoSlide 
            item={item} 
            width={width} 
            height={height} 
            isActive={currentIndex === index}
            navigation={navigation}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        snapToInterval={width}
        snapToAlignment="center"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />
      
      <SafeAreaView style={styles.bottomContainer} pointerEvents="none">
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index.toString()}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background to blend with videos
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Subtle darken for text readability
  },
  actionContainer: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  button: {
    backgroundColor: COLORS.primary, // Blush pink button
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.secondary, // Black text on blush pink
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
