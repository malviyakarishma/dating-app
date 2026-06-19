import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function AuthBackground({ children }) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Gentle floating animation for the couple art
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Base Gradient */}
      <LinearGradient
        colors={[COLORS.wineDark, COLORS.plum, '#050102']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Couple Silhouette Image */}
      <Animated.Image 
        source={require('../../../assets/couple_art.png')} 
        style={[styles.coupleImage, imageAnimatedStyle]} 
        resizeMode="cover"
      />

      {/* Gradient overlay to blend the image seamlessly into the background */}
      <LinearGradient
        colors={['transparent', '#050102']}
        locations={[0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

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
  coupleImage: {
    position: 'absolute',
    bottom: -height * 0.05,
    width: width,
    height: height * 0.6,
    opacity: 0.8,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  }
});
