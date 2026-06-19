import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { validateEmail } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import AuthBackground from '../components/auth/AuthBackground';
import GlassInput from '../components/auth/GlassInput';
import PremiumButton from '../components/auth/PremiumButton';

const { width: W } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const { forgotPassword } = useAuth();

  const handleReset = async () => {
    let valid = true;
    let newErrors = {};

    newErrors.email = validateEmail(email);
    if (newErrors.email) valid = false;

    setErrors(newErrors);
    setApiError(null);

    if (valid) {
      try {
        setIsSubmitting(true);
        await forgotPassword(email.trim());
        navigation.navigate('VerifyOtp', { email: email.trim() });
      } catch (err) {
        setApiError(err.message || 'Failed to send OTP. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
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
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={W * 0.07} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive an OTP</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <GlassInput
              icon="mail-outline"
              placeholder="Email Address"
              value={email}
              onChangeText={(val) => { setEmail(val.toLowerCase()); setErrors({ ...errors, email: null }); }}
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={200}
              hasError={!!errors.email}
              autoFocus
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            {apiError ? <Text style={styles.apiErrorText}>{apiError}</Text> : null}

            <View style={styles.buttonWrapper}>
              <PremiumButton 
                title="Send OTP" 
                onPress={handleReset} 
                isLoading={isSubmitting} 
              />
            </View>
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
  apiErrorText: {
    color: '#FF4D67', 
    fontSize: W * 0.032, 
    marginBottom: W * 0.04, 
    textAlign: 'center',
  },
  buttonWrapper: {
    marginTop: W * 0.04,
  },
});
