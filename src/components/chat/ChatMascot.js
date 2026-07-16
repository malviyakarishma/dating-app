import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const { width: W } = Dimensions.get('window');

// Pre-require the assets so Metro bundles them
const SPIDERMAN_IMG = require('../../../assets/spiderman.png');
const GWEN_IMG = require('../../../assets/gwen.png');

/**
 * ChatMascot Component
 * 
 * Displays a Spider-Man (male) or Spider-Gwen (female) emoji
 * hanging from the top-right of the chat header, with idle/typing swing.
 */
export default function ChatMascot({ gender, isTyping, isOnline, showIntro }) {
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(-80);

  const isFemale = gender === 'Female';
  const mascotSource = isFemale ? GWEN_IMG : SPIDERMAN_IMG;

  // Intro: drop in with spring
  useEffect(() => {
    if (showIntro) {
      translateY.value = -80;
      translateY.value = withSpring(0, { damping: 12, stiffness: 90 });
    } else {
      translateY.value = 0;
    }
  }, [showIntro]);

  // Swing animation
  useEffect(() => {
    if (isTyping) {
      // Energetic swing when other user is typing
      rotation.value = withRepeat(
        withSequence(
          withTiming(12, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-12, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Gentle idle sway
      rotation.value = withRepeat(
        withSequence(
          withTiming(4, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(-4, { duration: 2500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    }
  }, [isTyping]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image
        source={mascotSource}
        style={styles.mascotImage}
        resizeMode="contain"
      />

      {/* Typing indicator bubble */}
      {isTyping && (
        <View style={styles.typingBubble}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, { opacity: 0.7 }]} />
          <View style={[styles.typingDot, { opacity: 0.4 }]} />
        </View>
      )}

      {/* Sleep indicator when offline */}
      {!isOnline && (
        <View style={styles.sleepBubble}>
          <Text style={styles.sleepText}>z</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -24,
    right: 8,
    alignItems: 'center',
    zIndex: 100,
    transformOrigin: 'top center',
  },
  mascotImage: {
    width: 80,
    height: 120,
  },
  typingBubble: {
    position: 'absolute',
    bottom: 8,
    right: -18,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 26,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  sleepBubble: {
    position: 'absolute',
    top: 20,
    right: -12,
  },
  sleepText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
