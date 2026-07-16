import React, { useEffect } from 'react';
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

export default function LoveLetterEffect({ onComplete }) {
  const translateY = useSharedValue(H);
  const translateX = useSharedValue(-50);
  const rotation = useSharedValue(-20);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Envelope flies in
    translateY.value = withTiming(H / 3, { duration: 800, easing: Easing.out(Easing.cubic) });
    translateX.value = withTiming(W / 2 - 40, { duration: 800, easing: Easing.out(Easing.cubic) });
    rotation.value = withTiming(0, { duration: 800 });

    // Open/Bounce
    translateY.value = withDelay(
      800,
      withSequence(
        withTiming(H / 3 - 20, { duration: 200 }),
        withTiming(H / 3, { duration: 200 })
      )
    );

    // Fade out
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

  // Mini hearts coming out of the envelope
  const renderMiniHearts = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <MiniHeart key={i} delay={1000 + i * 150} />
    ));
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.envelopeContainer, animatedStyle]}>
        <Text style={styles.envelopeText}>💌</Text>
        {renderMiniHearts()}
      </Animated.View>
    </View>
  );
}

const MiniHeart = ({ delay }) => {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 200 }));
    ty.value = withDelay(delay, withTiming(-100 - Math.random() * 50, { duration: 1000 }));
    tx.value = withDelay(delay, withTiming((Math.random() - 0.5) * 100, { duration: 1000 }));
    op.value = withDelay(delay + 800, withTiming(0, { duration: 200 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.miniHeart, style]}>
      <Text style={{ fontSize: 16 }}>❤️</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  envelopeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  envelopeText: {
    fontSize: 80,
  },
  miniHeart: {
    position: 'absolute',
    top: 20,
  },
});
