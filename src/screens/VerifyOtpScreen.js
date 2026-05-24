import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width: W } = Dimensions.get('window');

export default function VerifyOtpScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { verifyOtp, forgotPassword } = useAuth();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      await verifyOtp(email, otp);
      navigation.navigate('ResetPassword', { email });
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      setError(null);
      setSuccessMessage(null);
      await forgotPassword(email);
      setSuccessMessage('OTP code has been resent to your email!');
    } catch (err) {
      setError(err.message || 'Resend failed. Please try again later.');
    } finally {
      setIsResending(false);
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
          <Text style={styles.title}>Verify Code</Text>
          <Text style={styles.subtitle}>Enter the 6-digit OTP sent to {email}</Text>
        </View>

        <BlurView intensity={30} tint="dark" style={[styles.formCard, { overflow: 'hidden' }]}>
          <View style={[styles.inputWrap, error && { borderColor: '#FF4D67', marginBottom: 0 }]}>
            <Ionicons name="key-outline" size={W * 0.05} color={COLORS.taupe} />
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={otp}
              onChangeText={(val) => { setOtp(val.replace(/[^0-9]/g, '')); setError(null); }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <TouchableOpacity onPress={handleVerify} activeOpacity={0.8} disabled={isSubmitting}>
            <LinearGradient colors={isSubmitting ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)'] : [COLORS.maroon, COLORS.burgundy]} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{isSubmitting ? 'Verifying...' : 'Verify OTP'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Didn't receive code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={isResending}>
            <Text style={styles.bottomLink}>{isResending ? 'Sending...' : 'Resend Code'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('SignIn')}>
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
  subtitle: { fontSize: W * 0.035, color: COLORS.taupe, textAlign: 'center', paddingHorizontal: 10 },
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
  successText: { color: '#4CCC93', fontSize: 12, marginTop: 4, marginBottom: W * 0.04, marginLeft: 8, fontWeight: '600' },
  input: { flex: 1, paddingVertical: W * 0.04, fontSize: W * 0.04, color: '#fff', marginLeft: W * 0.03, letterSpacing: 4 },
  primaryBtn: { paddingVertical: W * 0.04, borderRadius: W * 0.07, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: W * 0.045, fontWeight: 'bold' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: W * 0.06 },
  bottomText: { color: COLORS.taupe, fontSize: W * 0.038 },
  bottomLink: { color: COLORS.cream, fontSize: W * 0.038, fontWeight: 'bold' },
  backBtn: { alignItems: 'center', marginTop: W * 0.04 },
  backText: { color: COLORS.taupe, fontSize: W * 0.038, fontWeight: 'bold' },
});
