import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Dimensions, ScrollView, Animated, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const { width: W } = Dimensions.get('window');

export default function ProfileSetupStep3Screen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, []);

  const { signUp } = useAuth();

  const handlePickImage = async () => {
    if (photos.length >= 6) {
      setError("You can only upload up to 6 photos.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
      setError(null);
    }
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newErrors);
    if (newPhotos.length < 3) {
      // Just let it be, they will see error on submit
    } else {
      setError(null);
    }
  };
  
  // Actually, fixing the above typo
  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  }

  const handleComplete = () => {
    if (photos.length < 3) {
      setError("Please add at least 3 photos.");
      return;
    }
    if (photos.length > 6) {
      setError("You can only upload up to 6 photos.");
      return;
    }
    
    setError(null);
    signUp();
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={W * 0.05} color={COLORS.taupe} />
            </TouchableOpacity>

            {/* Progress Bar (3 dots, step 3 active) */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLine} />
              <Animated.View style={[styles.progressLine, { backgroundColor: '#FF4D67', zIndex: 2, width: progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['50%', '100%'] }) }]} />
              {[0, 1, 2].map((step, index) => {
                const isActive = index === 2; // Step 3 is active
                const isPast = index < 2;
                return (
                  <View key={step} style={[isActive ? styles.dotActiveWrap : styles.dotInactiveWrap, { zIndex: 3 }]}>
                    <View style={[styles.dotInactive, isActive && styles.dotActive, isPast && { backgroundColor: '#FF4D67' }]} />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Show your best self</Text>
            <Text style={styles.subtitle}>Upload 3 to 6 photos to complete your profile.</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.photoGrid}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const photoUri = photos[index];
                return (
                  <View key={index} style={styles.photoSlotWrap}>
                    {photoUri ? (
                      <View style={styles.photoContainer}>
                        <Image source={{ uri: photoUri }} style={styles.photo} />
                        <TouchableOpacity 
                          style={styles.removeBtn} 
                          onPress={() => removePhoto(index)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.emptySlot, error && index < 3 && photos.length < 3 ? { borderColor: '#FF4D67' } : {}]} 
                        onPress={handlePickImage} 
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={W * 0.08} color="rgba(255,255,255,0.3)" />
                        {index === 0 && <Text style={styles.mainPhotoText}>Main</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={{ marginTop: W * 0.08 }}>
              <TouchableOpacity onPress={handleComplete} activeOpacity={0.8}>
                <LinearGradient colors={[COLORS.maroon, COLORS.burgundy]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Complete Profile</Text>
                  <Ionicons name="checkmark-circle" size={W * 0.05} color="#fff" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footerWrap}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.taupe} />
              <Text style={styles.footerText}>Your photos are private and secure</Text>
            </View>

          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A0E13' },
  content: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  
  headerRow: { paddingHorizontal: W * 0.06, flexDirection: 'row', alignItems: 'center', marginBottom: W * 0.06, marginTop: W * 0.02 },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: W * 0.04 },
  
  progressContainer: { flex: 1, position: 'relative', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', top: 9 },
  dotInactiveWrap: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  dotInactive: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActiveWrap: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255, 77, 103, 0.4)', justifyContent: 'center', alignItems: 'center' },
  dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4D67' },

  titleContainer: { paddingHorizontal: W * 0.06, marginBottom: W * 0.06 },
  title: { fontSize: W * 0.08, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: W * 0.035, color: 'rgba(255,255,255,0.6)' },

  scrollContent: { paddingHorizontal: W * 0.06, paddingBottom: W * 0.1 },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoSlotWrap: {
    width: '31%',
    aspectRatio: 0.75, // 3:4 aspect ratio
    marginBottom: W * 0.04,
  },
  emptySlot: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPhotoText: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'bold',
  },
  photoContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4D67',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a0a0e',
  },

  errorText: { color: '#FF4D67', fontSize: 12, marginTop: 4, textAlign: 'center' },

  primaryBtn: {
    paddingVertical: W * 0.04, borderRadius: W * 0.07,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: W * 0.045, fontWeight: 'bold' },

  footerWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: W * 0.06 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 6 },
});
