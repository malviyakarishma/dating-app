import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { validateEmail } from '../utils/validators';

const { width: W } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  const handleReset = () => {
    let valid = true;
    let newErrors = {};

    newErrors.email = validateEmail(email);
    if (newErrors.email) valid = false;

    setErrors(newErrors);
    if (valid) {
      navigation.navigate('ResetPassword');
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/HOME.jpg')} style={styles.logo} />
        </View>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to reset</Text>
        </View>

        <BlurView intensity={30} tint="dark" style={[styles.formCard, { overflow: 'hidden' }]}>
          <View style={[styles.inputWrap, errors.email && { borderColor: '#FF4D67', marginBottom: 0 }]}>
            <Ionicons name="mail-outline" size={W * 0.05} color={COLORS.taupe} />
            <TextInput
              style={styles.input} placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={email} onChangeText={(val) => { setEmail(val.toLowerCase()); setErrors({...errors, email: null}); }} autoCapitalize="none" keyboardType="email-address"
              maxLength={200}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <TouchableOpacity onPress={handleReset} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.maroon, COLORS.burgundy]} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Send Reset Link</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  content: { flex: 1, padding: W * 0.06, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: W * 0.06 },
  logo: { width: W * 0.35, height: W * 0.35, resizeMode: 'contain' },
  headerContainer: { marginBottom: W * 0.08, alignItems: 'center' },
  title: { fontSize: W * 0.08, fontWeight: 'bold', color: '#fff', marginBottom: W * 0.02 },
  subtitle: { fontSize: W * 0.04, color: COLORS.taupe },
  formCard: {
    borderRadius: W * 0.05, padding: W * 0.05,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: W * 0.035, paddingHorizontal: W * 0.04,
    marginBottom: W * 0.04, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  errorText: { color: '#FF4D67', fontSize: 12, marginTop: 4, marginBottom: W * 0.04, marginLeft: 8 },
  input: { flex: 1, paddingVertical: W * 0.04, fontSize: W * 0.04, color: '#fff', marginLeft: W * 0.03 },
  primaryBtn: { paddingVertical: W * 0.04, borderRadius: W * 0.07, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: W * 0.045, fontWeight: 'bold' },
  backBtn: { alignItems: 'center', marginTop: W * 0.06 },
  backText: { color: COLORS.cream, fontSize: W * 0.038, fontWeight: 'bold' },
});
