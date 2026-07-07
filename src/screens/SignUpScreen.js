import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateRequired } from '../utils/validators';
import AuthBackground from '../components/auth/AuthBackground';
import GlassInput from '../components/auth/GlassInput';
import PremiumButton from '../components/auth/PremiumButton';

const { width: W } = Dimensions.get('window');

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = useAuth();

  const handleContinue = async () => {
    let valid = true;
    let newErrors = {};

    newErrors.name = validateRequired(name, "Full Name is required");
    newErrors.email = validateEmail(email);
    newErrors.password = validatePassword(password);

    if (newErrors.name || newErrors.email || newErrors.password) {
      valid = false;
    }

    setErrors(newErrors);
    if (valid) {
      try {
        setIsSubmitting(true);
        await signUp(name.trim(), email.trim(), password);
        // Navigate to Verify OTP screen
        navigation.navigate('VerifyOtp', { email: email.trim(), isRegistration: true });
      } catch (err) {
        setErrors({ ...newErrors, api: err.message || 'Registration failed. Please try again.' });
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to get started</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <GlassInput
              icon="person-outline"
              placeholder="Full Name"
              value={name}
              onChangeText={(val) => { setName(val); setErrors({ ...errors, name: null }); }}
              autoCapitalize="words"
              maxLength={200}
              hasError={!!errors.name}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

            <GlassInput
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={(val) => { setEmail(val.toLowerCase()); setErrors({ ...errors, email: null }); }}
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={200}
              hasError={!!errors.email}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            <GlassInput
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={(val) => { setPassword(val); setErrors({ ...errors, password: null }); }}
              secureTextEntry
              maxLength={200}
              hasError={!!errors.password}
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            {errors.api ? <Text style={styles.apiErrorText}>{errors.api}</Text> : null}

            <View style={styles.buttonWrapper}>
              <PremiumButton 
                title="Continue" 
                onPress={handleContinue} 
                isLoading={isSubmitting} 
              />
            </View>
          </View>

          {/* Social Logins */}
          <View style={styles.socialContainer}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or sign up with</Text>
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
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.bottomLink}>Sign In</Text>
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
    marginTop: W * 0.05,
    marginBottom: W * 0.08, 
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
    marginTop: W * 0.02,
  },
  socialContainer: {
    marginTop: W * 0.02,
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
