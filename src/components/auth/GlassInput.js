import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const { width: W } = Dimensions.get('window');

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function GlassInput({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  keyboardType,
  autoCapitalize,
  maxLength,
  hasError,
  autoFocus
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
  }, [isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [
        hasError ? '#FF4D67' : 'rgba(255,255,255,0.1)', 
        hasError ? '#FF4D67' : COLORS.pinkHighlight
      ]
    );
    const backgroundColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)']
    );

    return {
      borderColor,
      backgroundColor,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, hasError && styles.errorContainer]}>
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={W * 0.05} 
            color={isFocused ? COLORS.pinkHighlight : COLORS.taupe} 
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={COLORS.pinkHighlight}
          autoFocus={autoFocus}
        />
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={W * 0.05} 
              color={COLORS.taupe} 
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: W * 0.04,
    marginBottom: W * 0.04,
    borderWidth: 1,
    overflow: 'hidden',
  },
  errorContainer: {
    marginBottom: 4, // reduce margin if error text follows
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: W * 0.04,
    minHeight: W * 0.14,
  },
  input: {
    flex: 1,
    paddingVertical: W * 0.04,
    fontSize: W * 0.042,
    color: '#ffffff',
    marginLeft: W * 0.03,
    letterSpacing: 0.5,
  },
  eyeIcon: {
    padding: W * 0.02,
  }
});
