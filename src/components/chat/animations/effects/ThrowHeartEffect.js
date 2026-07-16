import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const HeartParticle = ({ delay, startX, onFinish }) => {
  const translateY = useSharedValue(H / 2);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Entrance
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    scale.value = withDelay(delay, withSpring(1 + Math.random() * 0.5));
    
    // Float up and drift
    translateY.value = withDelay(
      delay,
      withTiming(H / 4 - Math.random() * 100, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      })
    );
    
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 150, {
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
      })
    );

    // Fade out
    opacity.value = withDelay(
      delay + 1500,
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
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.heartText}>❤️</Text>
    </Animated.View>
  );
};

export default function ThrowHeartEffect({ onComplete }) {
  const [particles] = useState(() => 
    Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 500,
      startX: W / 2 + (Math.random() - 0.5) * 100,
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
        <HeartParticle key={p.id} delay={p.delay} startX={p.startX} onFinish={handleFinish} />
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
  heartText: {
    fontSize: 32,
  },
});
