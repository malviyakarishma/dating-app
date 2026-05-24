import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateRequired } from '../utils/validators';

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
        // RootNavigator automatically navigates to ProfileSetup
        // because user.isProfileComplete === false
      } catch (err) {
        setErrors({ ...newErrors, api: err.message || 'Registration failed. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <BlurView intensity={30} tint="dark" style={[styles.formCard, { overflow: 'hidden' }]}>
          <View style={[styles.inputWrap, errors.name && { borderColor: '#FF4D67', marginBottom: 0 }]}>
            <Ionicons name="person-outline" size={W * 0.05} color={COLORS.taupe} />
            <TextInput
              style={styles.input} placeholder="Full Name"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={name} onChangeText={(val) => { setName(val); setErrors({...errors, name: null}); }} autoCapitalize="words"
              maxLength={200}
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

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

          <View style={[styles.inputWrap, errors.password && { borderColor: '#FF4D67', marginBottom: 0 }]}>
            <Ionicons name="lock-closed-outline" size={W * 0.05} color={COLORS.taupe} />
            <TextInput
              style={styles.input} placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={password} onChangeText={(val) => { setPassword(val); setErrors({...errors, password: null}); }} secureTextEntry
              maxLength={200}
            />
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          {errors.api ? <Text style={[styles.errorText, { textAlign: 'center', marginLeft: 0 }]}>{errors.api}</Text> : null}

          <TouchableOpacity onPress={handleContinue} activeOpacity={0.8} disabled={isSubmitting}>
            <LinearGradient colors={isSubmitting ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)'] : [COLORS.maroon, COLORS.burgundy]} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{isSubmitting ? 'Creating Account...' : 'Continue'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.bottomLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: W * 0.035, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  errorText: { color: '#FF4D67', fontSize: 12, marginTop: 4, marginBottom: W * 0.035, marginLeft: 8 },
  input: { flex: 1, paddingVertical: W * 0.04, fontSize: W * 0.04, color: '#fff', marginLeft: W * 0.03 },
  primaryBtn: { paddingVertical: W * 0.04, borderRadius: W * 0.07, alignItems: 'center', marginTop: W * 0.02 },
  primaryBtnText: { color: '#fff', fontSize: W * 0.045, fontWeight: 'bold' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: W * 0.06 },
  bottomText: { color: COLORS.taupe, fontSize: W * 0.038 },
  bottomLink: { color: COLORS.cream, fontSize: W * 0.038, fontWeight: 'bold' },
});
