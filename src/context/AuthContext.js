import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedRefresh = await AsyncStorage.getItem('refreshToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken) {
          // Temporarily set them so the app doesn't wait to render
          setUserToken(storedToken);
          if (storedRefresh) setRefreshToken(storedRefresh);
          if (storedUser) setUser(JSON.parse(storedUser));

          // Verify token and sync user state with backend
          try {
            const result = await userService.getProfile(storedToken);
            if (result.data && result.data.user) {
              setUser(result.data.user);
              await AsyncStorage.setItem('user', JSON.stringify(result.data.user));
            }
          } catch (err) {
            console.log('Token invalid or user deleted, clearing local storage...');
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');
            setUserToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Failed to load authentication state', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadTokens();
  }, []);

  // ─── Sign In (existing user) ──────────────────────────────
  const signIn = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      const { user: loggedInUser, tokens } = result.data;

      await AsyncStorage.setItem('userToken', tokens.access.token);
      await AsyncStorage.setItem('refreshToken', tokens.refresh.token);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));

      setUserToken(tokens.access.token);
      setRefreshToken(tokens.refresh.token);
      setUser(loggedInUser);
      return { success: true };
    } catch (error) {
      console.error('Sign In Error:', error);
      throw error;
    }
  };

  // ─── Sign Up (new user – only name/email/password) ────────
  // Creates the user entry in the database. After this,
  // RootNavigator shows ProfileSetup screens because isProfileComplete is false.
  const signUp = async (name, email, password) => {
    try {
      const result = await authService.register(name, email, password);
      const { user: newUser, tokens } = result.data;

      await AsyncStorage.setItem('userToken', tokens.access.token);
      await AsyncStorage.setItem('refreshToken', tokens.refresh.token);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setUserToken(tokens.access.token);
      setRefreshToken(tokens.refresh.token);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      console.error('Sign Up Error:', error);
      throw error;
    }
  };

  // ─── Sign Out ─────────────────────────────────────────────
  const signOut = async () => {
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (e) {
      console.warn('Backend logout call failed', e);
    } finally {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      setUserToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  };

  // ─── Update Profile Step (PATCH /api/users/profile) ───────
  // Called after each profile-setup step (Step1, Step2, Step3).
  // Persists the fields to the backend and updates local user state.
  const updateProfileStep = async (profileData) => {
    try {
      const result = await userService.updateProfile(profileData);
      const updatedUser = result.data.user;

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update Profile Step Error:', error);
      throw error;
    }
  };

  // ─── Upload Photos (POST /api/users/upload → Cloudinary) ───
  // Returns an array of Cloudinary secure URLs of the uploaded images.
  const uploadPhotos = async (photoUris) => {
    try {
      const result = await userService.uploadProfilePhotos(photoUris);
      return result.data.urls;
    } catch (error) {
      console.error('Upload Photos Error:', error);
      throw error;
    }
  };

  // ─── Forgot / Verify / Reset Password ─────────────────────
  const forgotPassword = async (email) => {
    return authService.forgotPassword(email);
  };

  const verifyOtp = async (email, otp) => {
    return authService.verifyOtp(email, otp);
  };

  const resetPassword = async (email, password) => {
    return authService.resetPassword(email, password);
  };

  const authContext = {
    userToken,
    refreshToken,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfileStep,
    uploadPhotos,
    forgotPassword,
    verifyOtp,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
