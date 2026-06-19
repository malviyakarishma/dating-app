import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring
} from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

const { width: W } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function PremiumButton({ title, onPress, disabled, isLoading, style }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedTouchable
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      style={[styles.buttonContainer, style]}
    >
      <LinearGradient
        colors={
          disabled || isLoading 
            ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
            : [COLORS.maroon, '#8A102D']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, (disabled || isLoading) && styles.textDisabled]}>
          {isLoading ? 'Processing...' : title}
        </Text>
      </LinearGradient>
      
      {/* Subtle bottom glow effect */}
      {!(disabled || isLoading) && (
        <LinearGradient
          colors={[COLORS.maroon, 'transparent']}
          style={styles.glow}
        />
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: W * 0.08,
    marginTop: W * 0.04,
    shadowColor: COLORS.pinkHighlight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    paddingVertical: W * 0.04,
    borderRadius: W * 0.08,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 143, 171, 0.3)', // pinkHighlight with opacity
  },
  text: {
    color: '#ffffff',
    fontSize: W * 0.045,
    fontWeight: '700',
    letterSpacing: 1,
  },
  textDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  glow: {
    position: 'absolute',
    bottom: -10,
    left: '10%',
    right: '10%',
    height: 20,
    borderRadius: 10,
    opacity: 0.5,
    zIndex: -1,
  }
});
