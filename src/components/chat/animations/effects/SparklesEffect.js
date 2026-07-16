import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const SparkleParticle = ({ delay, startX, startY, onFinish }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Shimmer and grow
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.5, { duration: 200 }),
        withTiming(1, { duration: 200 })
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.5, { duration: 300, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 400 })
      )
    );

    rotation.value = withDelay(
      delay,
      withRepeat(withTiming(180, { duration: 600 }), 2, false)
    );

    // Fade out
    opacity.value = withDelay(
      delay + 1000,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onFinish) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: startX },
      { translateY: startY },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.sparkleText}>✨</Text>
    </Animated.View>
  );
};

export default function SparklesEffect({ onComplete }) {
  const [particles] = useState(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 800,
      startX: Math.random() * W,
      startY: Math.random() * (H * 0.6) + H * 0.1, // upper 60% of screen
    }))
  );

  const [finishedCount, setFinishedCount] = useState(0);

  const handleFinish = () => {
    setFinishedCount((prev) => {
      const next = prev + 1;
      if (next === particles.length) {
        onComplete();
      }
      return next;
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <SparkleParticle
          key={p.id}
          delay={p.delay}
          startX={p.startX}
          startY={p.startY}
          onFinish={handleFinish}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sparkleText: {
    fontSize: 28,
  },
});
