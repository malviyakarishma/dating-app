import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width: W } = Dimensions.get('window');

export default function EditProfileScreen() {
  const { user, updateProfileStep } = useAuth();
  const navigation = useNavigation();

  const [name, setName] = useState(user?.name || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await updateProfileStep({
        name: name.trim(),
        occupation: occupation.trim(),
        location: location.trim(),
        bio: bio.trim(),
      });
      
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerWrap}>
        <BlurView intensity={20} tint="dark" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={W * 0.06} color={COLORS.cream} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: W * 0.06 }} />
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="rgba(255,255,255,0.3)"
              placeholder="Your name"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Occupation</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={occupation}
              onChangeText={setOccupation}
              placeholderTextColor="rgba(255,255,255,0.3)"
              placeholder="What do you do?"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="rgba(255,255,255,0.3)"
              placeholder="City, State"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <View style={[styles.inputWrap, styles.textAreaWrap]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholderTextColor="rgba(255,255,255,0.3)"
              placeholder="Tell us a bit about yourself..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave} 
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.maroon, COLORS.burgundy]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  headerWrap: { paddingTop: Platform.OS === 'ios' ? 54 : 40, paddingHorizontal: W * 0.04, zIndex: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: W * 0.04, padding: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: W * 0.045, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: W * 0.05, paddingBottom: 60 },

  inputGroup: { marginBottom: W * 0.05 },
  label: { color: COLORS.cream, fontSize: W * 0.038, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: W * 0.03, paddingHorizontal: W * 0.04,
  },
  input: { color: '#fff', fontSize: W * 0.04, height: 50 },
  textAreaWrap: { paddingVertical: W * 0.03 },
  textArea: { height: 100 },
  
  errorText: { color: '#FF4D67', fontSize: 14, textAlign: 'center', marginBottom: 15 },
  
  saveBtn: { marginTop: W * 0.08, borderRadius: W * 0.08, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: W * 0.04, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: W * 0.042, fontWeight: 'bold' },
});
