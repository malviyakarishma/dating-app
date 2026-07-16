import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const SEND_EFFECTS = [
  { id: 'heart', name: 'Throw Heart', icon: 'heart', color: '#ff4d67' },
  { id: 'web', name: 'Shoot Web', icon: 'aperture', color: '#fff' },
  { id: 'letter', name: 'Love Letter', icon: 'mail', color: '#f3a683' },
  { id: 'sparkles', name: 'Sparkles', icon: 'sparkles', color: '#feca57' },
  { id: 'rose', name: 'Rose Toss', icon: 'flower', color: '#ff5252' },
];

export default function SendEffectPicker({ visible, onClose, onSelect, selectedEffectId }) {
  const [focusedEffect, setFocusedEffect] = React.useState(null);

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFocusedEffect(null); // Reset focus when opened
    }
  }, [visible]);

  const handleFocusOrSelect = (effectId) => {
    Haptics.selectionAsync();
    
    if (focusedEffect === effectId) {
      // Already focused, so select it and close
      onSelect(effectId);
    } else {
      // Focus it to show the description
      setFocusedEffect(effectId);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Invisible Backdrop to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Vertical Stack Menu */}
        <View style={styles.menuContainer}>
          {SEND_EFFECTS.map((effect, index) => {
            const isFocused = focusedEffect === effect.id;
            return (
              <Animated.View 
                key={effect.id}
                entering={FadeInDown.delay(index * 50).springify()}
                exiting={FadeOutDown.duration(200)}
                style={styles.menuItemWrapper}
              >
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    isFocused && { backgroundColor: effect.color, width: 'auto', paddingRight: 16 }
                  ]}
                  onPress={() => handleFocusOrSelect(effect.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, isFocused && { backgroundColor: 'transparent' }]}>
                    <Ionicons 
                      name={effect.icon} 
                      size={24} 
                      color={isFocused ? '#fff' : effect.color} 
                    />
                  </View>
                  
                  {isFocused && (
                    <Animated.Text entering={FadeInDown.duration(200)} style={styles.effectName}>
                      {effect.name}
                    </Animated.Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          }).reverse() /* Reverse to build from bottom up */}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 90, // Position above the input bar (adjust if needed)
    left: 12,   // Align with the + button
    alignItems: 'flex-start',
    zIndex: 1000,
  },
  menuItemWrapper: {
    marginBottom: 12,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 15, 20, 0.95)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: 50, // Default circle width
    height: 50,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  effectName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
});
