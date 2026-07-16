import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import AuthBackground from '../components/auth/AuthBackground';
import GlassInput from '../components/auth/GlassInput';
import PremiumButton from '../components/auth/PremiumButton';

const { width: W } = Dimensions.get('window');

export default function VerifyOtpScreen({ route, navigation }) {
  const { email, isRegistration } = route.params || {};
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { verifyOtp, forgotPassword, verifyRegistration, resendRegistrationOtp } = useAuth();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      if (isRegistration) {
        await verifyRegistration(email, otp);
        // After verifyRegistration, AuthContext will update userToken and user state.
        // This causes RootNavigator to automatically unmount the Auth stack and navigate to ProfileSetup.
        // No manual navigation is needed here.
      } else {
        await verifyOtp(email, otp);
        navigation.navigate('ResetPassword', { email });
      }
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
      
      if (isRegistration) {
        await resendRegistrationOtp(email);
      } else {
        await forgotPassword(email);
      }
      
      setSuccessMessage('OTP code has been resent to your email!');
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Resend failed. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backIcon} 
              onPress={() => navigation.navigate('SignIn')}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={W * 0.08} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>Enter the 6-digit OTP sent to{"\n"}{email}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <GlassInput
              icon="key-outline"
              placeholder="000000"
              value={otp}
              onChangeText={(val) => { setOtp(val.replace(/[^0-9]/g, '')); setError(null); }}
              keyboardType="number-pad"
              maxLength={6}
              hasError={!!error}
              autoFocus
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            <View style={styles.buttonWrapper}>
              <PremiumButton 
                title="Verify OTP" 
                onPress={handleVerify} 
                isLoading={isSubmitting} 
              />
            </View>
          </View>

          {/* Bottom Resend Row */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Didn't receive code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={isResending || countdown > 0} activeOpacity={0.7}>
              <Text style={[styles.bottomLink, countdown > 0 && { color: 'rgba(255,255,255,0.4)' }]}>
                {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: { 
    flex: 1, 
    padding: W * 0.06, 
    justifyContent: 'center' 
  },
  headerContainer: { 
    marginBottom: W * 0.1, 
  },
  backIcon: {
    marginBottom: W * 0.06,
    width: W * 0.1,
  },
  title: { 
    fontSize: W * 0.09, 
    fontWeight: '800', 
    color: '#ffffff', 
    marginBottom: W * 0.02,
    letterSpacing: 0.5,
  },
  subtitle: { 
    fontSize: W * 0.04, 
    color: 'rgba(255,255,255,0.6)', 
    letterSpacing: 0.5,
    lineHeight: W * 0.06,
  },
  formContainer: {
    marginBottom: W * 0.04,
  },
  errorText: { 
    color: '#FF4D67', 
    fontSize: W * 0.032, 
    marginBottom: W * 0.03, 
    marginTop: -W * 0.02,
    marginLeft: W * 0.02 
  },
  successText: { 
    color: '#4CCC93', 
    fontSize: W * 0.032, 
    marginBottom: W * 0.03, 
    marginTop: -W * 0.02,
    marginLeft: W * 0.02, 
    fontWeight: '600' 
  },
  buttonWrapper: {
    marginTop: W * 0.04,
  },
  bottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 'auto',
    marginBottom: W * 0.06,
  },
  bottomText: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: W * 0.038 
  },
  bottomLink: { 
    color: COLORS.pinkHighlight, 
    fontSize: W * 0.038, 
    fontWeight: 'bold' 
  },
});
