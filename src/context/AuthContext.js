import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import { onUnauthorized } from '../services/apiClient.js';
import { initSocket, disconnectSocket } from '../services/socket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    onUnauthorized(async () => {
      console.log('Session expired, triggering automatic logout...');
      disconnectSocket();
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      setUserToken(null);
      setRefreshToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedRefresh = await AsyncStorage.getItem('refreshToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken) {
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;
          if (parsedUser && !parsedUser.isProfileComplete) {
            // User closed the app before completing profile, force them to login again
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');
            setIsLoading(false);
            return;
          }

          // Temporarily set them so the app doesn't wait to render
          setUserToken(storedToken);
          if (storedRefresh) setRefreshToken(storedRefresh);
          if (parsedUser) setUser(parsedUser);

          // Verify token and sync user state with backend
          try {
            initSocket();
            const result = await userService.getProfile(storedToken);
            if (result.data && result.data.user) {
              const fetchedUser = result.data.user;
              if (!fetchedUser.isProfileComplete) {
                // If backend says profile is incomplete, log them out
                console.log('Profile incomplete on backend, clearing local storage...');
                disconnectSocket();
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('refreshToken');
                await AsyncStorage.removeItem('user');
                setUserToken(null);
                setRefreshToken(null);
                setUser(null);
              } else {
                setUser(fetchedUser);
                await AsyncStorage.setItem('user', JSON.stringify(fetchedUser));
              }
            }
          } catch (err) {
            console.log('Token invalid or user deleted, clearing local storage...');
            disconnectSocket();
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
      initSocket();
      return { success: true };
    } catch (error) {
      console.error('Sign In Error:', error);
      throw error;
    }
  };

  // ─── Sign Up (new user – only name/email/password) ────────
  // Creates the user entry in the database. Returns success so frontend can navigate to Verify OTP.
  const signUp = async (name, email, password) => {
    try {
      await authService.register(name, email, password);
      // Do not log in or save tokens yet. Wait for OTP verification.
      return { success: true, email };
    } catch (error) {
      throw error;
    }
  };

  // ─── Verify Registration OTP ─────────────────────────────
  const verifyRegistration = async (email, otp) => {
    try {
      const result = await authService.verifyRegistration(email, otp);
      const { user: newUser, tokens } = result.data;

      await AsyncStorage.setItem('userToken', tokens.access.token);
      await AsyncStorage.setItem('refreshToken', tokens.refresh.token);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setUserToken(tokens.access.token);
      setRefreshToken(tokens.refresh.token);
      setUser(newUser);
      initSocket();
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // ─── Resend Registration OTP ─────────────────────────────
  const resendRegistrationOtp = async (email) => {
    try {
      await authService.resendRegistrationOtp(email);
      return { success: true };
    } catch (error) {
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
      disconnectSocket();
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

  // ─── Delete Photo (DELETE /api/users/photo → Cloudinary + DB) ───
  // Deletes a single photo from Cloudinary and removes it from the DB.
  // Also updates local user state to reflect removal.
  const deletePhoto = async (photoUrl) => {
    try {
      const result = await userService.deletePhoto(photoUrl);
      // Update local user state with the new photos array from server
      const updatedPhotos = result.data.photos;
      const updatedUser = { ...user, photos: updatedPhotos };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedPhotos;
    } catch (error) {
      console.error('Delete Photo Error:', error);
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
    verifyRegistration,
    resendRegistrationOtp,
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
