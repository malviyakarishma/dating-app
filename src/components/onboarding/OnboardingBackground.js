import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function OnboardingBackground({ children }) {
  const orb1X = useSharedValue(-100);
  const orb1Y = useSharedValue(-100);
  
  const orb2X = useSharedValue(width - 50);
  const orb2Y = useSharedValue(height - 200);

  const orb3X = useSharedValue(width / 2);
  const orb3Y = useSharedValue(height / 2);

  useEffect(() => {
    // Gentle ambient movement for orbs
    orb1X.value = withRepeat(
      withSequence(
        withTiming(width * 0.4, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-100, { duration: 18000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.4, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-100, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orb2X.value = withRepeat(
      withSequence(
        withTiming(width * 0.1, { duration: 20000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width + 100, { duration: 16000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.5, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height + 100, { duration: 14000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    orb3X.value = withRepeat(
      withSequence(
        withTiming(width * 0.9, { duration: 22000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-50, { duration: 19000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb3Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.9, { duration: 21000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.1, { duration: 18000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb3X.value }, { translateY: orb3Y.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.wineDark, COLORS.plum, '#050102']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Background Glowing Orbs */}
      <Animated.View style={[styles.orb, styles.orb1, orb1Style]} />
      <Animated.View style={[styles.orb, styles.orb2, orb2Style]} />
      <Animated.View style={[styles.orb, styles.orb3, orb3Style]} />

      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Grid Pattern overlay for texture */}
      <View style={styles.noiseOverlay} pointerEvents="none" />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050102',
  },
  orb: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.5,
  },
  orb1: {
    width: 350,
    height: 350,
    backgroundColor: COLORS.maroon,
    top: -50,
    left: -50,
  },
  orb2: {
    width: 400,
    height: 400,
    backgroundColor: COLORS.plum,
    bottom: -100,
    right: -100,
  },
  orb3: {
    width: 250,
    height: 250,
    backgroundColor: COLORS.pinkHighlight,
    opacity: 0.2,
    top: height / 3,
    left: width / 3,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  }
});
