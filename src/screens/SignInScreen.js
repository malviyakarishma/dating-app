import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width: W } = Dimensions.get('window');

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();

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
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <BlurView intensity={30} tint="dark" style={[styles.formCard, { overflow: 'hidden' }]}>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={W * 0.05} color={COLORS.taupe} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={email}
              onChangeText={(val) => setEmail(val.toLowerCase())}
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={200}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={W * 0.05} color={COLORS.taupe} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              maxLength={200}
            />
          </View>

          {error ? <Text style={{ color: '#FF4D67', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{error}</Text> : null}

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignIn} activeOpacity={0.8} disabled={isSubmitting}>
            <LinearGradient colors={isSubmitting ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)'] : [COLORS.maroon, COLORS.burgundy]} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{isSubmitting ? 'Signing In...' : 'Sign In'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.bottomLink}>Sign Up</Text>
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
  input: { flex: 1, paddingVertical: W * 0.04, fontSize: W * 0.04, color: '#fff', marginLeft: W * 0.03 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: W * 0.05 },
  forgotPasswordText: { color: COLORS.cream, fontSize: W * 0.033 },
  primaryBtn: { paddingVertical: W * 0.04, borderRadius: W * 0.07, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: W * 0.045, fontWeight: 'bold' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: W * 0.06 },
  bottomText: { color: COLORS.taupe, fontSize: W * 0.038 },
  bottomLink: { color: COLORS.cream, fontSize: W * 0.038, fontWeight: 'bold' },
});
