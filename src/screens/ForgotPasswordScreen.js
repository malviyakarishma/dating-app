import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ImageBackground, Image } from 'react-native';
import { COLORS } from '../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  return (
    <ImageBackground 
      source={require('../../assets/coco.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
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

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('ResetPassword')}
            >
              <Text style={styles.primaryButtonText}>Send Reset Link</Text>
            </TouchableOpacity>

            <View style={styles.bottomContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.authSecondary,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.authPrimary,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: COLORS.authPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
    marginTop: 10,
  },
  primaryButtonText: {
    color: COLORS.authBackground,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomContainer: {
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.authSecondary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
