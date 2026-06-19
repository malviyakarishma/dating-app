import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { validatePassword } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import AuthBackground from '../components/auth/AuthBackground';
import GlassInput from '../components/auth/GlassInput';
import PremiumButton from '../components/auth/PremiumButton';

const { width: W } = Dimensions.get('window');

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const { resetPassword } = useAuth();

  const handleUpdate = async () => {
    let valid = true;
    let newErrors = {};

    newErrors.password = validatePassword(password);
    if (newErrors.password) valid = false;

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm your password";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    setApiError(null);

    if (valid) {
      try {
        setIsSubmitting(true);
        await resetPassword(email, password);
        navigation.navigate('SignIn');
      } catch (err) {
        setApiError(err.message || 'Failed to reset password. Please try again.');
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
              onPress={() => navigation.navigate('SignIn')}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={W * 0.08} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>Enter your new password below</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <GlassInput
              icon="lock-closed-outline"
              placeholder="New Password"
              value={password}
              onChangeText={(val) => { setPassword(val); setErrors({ ...errors, password: null }); }}
              secureTextEntry
              maxLength={200}
              hasError={!!errors.password}
              autoFocus
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            <GlassInput
              icon="shield-checkmark-outline"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={(val) => { setConfirmPassword(val); setErrors({ ...errors, confirmPassword: null }); }}
              secureTextEntry
              maxLength={200}
              hasError={!!errors.confirmPassword}
            />
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

            {apiError ? <Text style={styles.apiErrorText}>{apiError}</Text> : null}

            <View style={styles.buttonWrapper}>
              <PremiumButton 
                title="Update Password" 
                onPress={handleUpdate} 
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
