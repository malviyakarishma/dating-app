import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

export default function ShootWebEffect({ onComplete }) {
  const scaleY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Shoot web
    scaleY.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });

    // Fade out and cleanup
    opacity.value = withDelay(
      800,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scaleY: scaleY.value },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.webLine, animatedStyle]} />
      {/* Target splatter */}
      <Animated.View style={[styles.splatter, { opacity: opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  webLine: {
    position: 'absolute',
    top: H / 4,
    left: W / 2 - 2,
    width: 4,
    height: H / 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    transformOrigin: 'bottom center',
  },
  splatter: {
    position: 'absolute',
    top: H / 4 - 20,
    left: W / 2 - 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
