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
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const Petal = ({ delay, startX, startY }) => {
  const ty = useSharedValue(startY);
  const tx = useSharedValue(startX);
  const op = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 200 }));
    ty.value = withDelay(
      delay,
      withTiming(startY + 200 + Math.random() * 100, { duration: 1500, easing: Easing.in(Easing.quad) })
    );
    tx.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 100, { duration: 1500, easing: Easing.inOut(Easing.sin) })
    );
    rot.value = withDelay(delay, withTiming(360, { duration: 1500 }));
    
    op.value = withDelay(delay + 1000, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.petal, style]}>
      <Text style={{ fontSize: 16 }}>🥀</Text>
    </Animated.View>
  );
};

export default function RoseTossEffect({ onComplete }) {
  const translateY = useSharedValue(H);
  const translateX = useSharedValue(-50);
  const rotation = useSharedValue(-45);
  const opacity = useSharedValue(1);

  const [petals, setPetals] = useState([]);

  useEffect(() => {
    // Rose arc
    translateY.value = withTiming(H / 3, { duration: 600, easing: Easing.out(Easing.cubic) });
    translateX.value = withTiming(W / 2, { duration: 600, easing: Easing.linear });
    rotation.value = withTiming(45, { duration: 600 });

    // Drop
    translateY.value = withDelay(
      600,
      withTiming(H + 100, { duration: 800, easing: Easing.in(Easing.quad) })
    );
    translateX.value = withDelay(
      600,
      withTiming(W + 50, { duration: 800, easing: Easing.linear })
    );
    rotation.value = withDelay(600, withTiming(135, { duration: 800 }));

    // Generate some petals right at the peak
    setTimeout(() => {
      setPetals(Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        delay: i * 50,
        startX: W / 2 + (Math.random() - 0.5) * 40,
        startY: H / 3 + (Math.random() - 0.5) * 40,
      })));
    }, 600);

    // Fade out and cleanup
    opacity.value = withDelay(
      2000,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.roseContainer, animatedStyle]}>
        <Text style={styles.roseText}>🌹</Text>
      </Animated.View>

      {petals.map(p => (
        <Petal key={p.id} delay={p.delay} startX={p.startX} startY={p.startY} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  roseContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roseText: {
    fontSize: 60,
  },
  petal: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
