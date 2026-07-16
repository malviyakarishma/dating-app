import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import AuthBackground from '../components/auth/AuthBackground';
import GlassInput from '../components/auth/GlassInput';
import PremiumButton from '../components/auth/PremiumButton';

const { width: W } = Dimensions.get('window');

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, resendRegistrationOtp } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await signIn(email.trim(), password);
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please try again.';
      if (errorMsg.toLowerCase().includes('verify your email')) {
        try {
          await resendRegistrationOtp(email.trim());
          navigation.navigate('VerifyOtp', { email: email.trim(), isRegistration: true });
        } catch (resendErr) {
          setError('Could not resend OTP: ' + (resendErr.message || 'Unknown error'));
        }
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your details to continue</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <GlassInput
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={(val) => { setEmail(val.toLowerCase()); setError(null); }}
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={200}
            />

            <GlassInput
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={(val) => { setPassword(val); setError(null); }}
              secureTextEntry
              maxLength={200}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PremiumButton 
              title="Sign In" 
              onPress={handleSignIn} 
              isLoading={isSubmitting} 
            />
          </View>

          {/* Social Logins */}
          <View style={styles.socialContainer}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.socialChip} activeOpacity={0.7}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <Ionicons name="logo-apple" size={W * 0.06} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialChip} activeOpacity={0.7}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <Ionicons name="logo-google" size={W * 0.055} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
              <Text style={styles.bottomLink}>Sign Up</Text>
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
    marginTop: W * 0.1,
    marginBottom: W * 0.12, 
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
  },
  formContainer: {
    marginBottom: W * 0.08,
  },
  forgotPassword: { 
    alignSelf: 'flex-end', 
    marginBottom: W * 0.06,
    marginTop: -W * 0.02,
  },
  forgotPasswordText: { 
    color: COLORS.pinkHighlight, 
    fontSize: W * 0.035,
    fontWeight: '600'
  },
  errorText: { 
    color: '#FF4D67', 
    fontSize: W * 0.032, 
    marginBottom: W * 0.04, 
    marginTop: -W * 0.02,
    marginLeft: W * 0.02 
  },
  socialContainer: {
    marginTop: W * 0.04,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: W * 0.06,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.4)',
    paddingHorizontal: W * 0.04,
    fontSize: W * 0.035,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: W * 0.05,
  },
  socialChip: {
    width: W * 0.18,
    height: W * 0.15,
    borderRadius: W * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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
