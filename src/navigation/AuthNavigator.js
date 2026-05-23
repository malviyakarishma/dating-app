import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ProfileSetupStep1Screen from '../screens/ProfileSetupStep1Screen';
import ProfileSetupStep2Screen from '../screens/ProfileSetupStep2Screen';
import ProfileSetupStep3Screen from '../screens/ProfileSetupStep3Screen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ProfileSetupStep1" component={ProfileSetupStep1Screen} />
      <Stack.Screen name="ProfileSetupStep2" component={ProfileSetupStep2Screen} />
      <Stack.Screen name="ProfileSetupStep3" component={ProfileSetupStep3Screen} />
    </Stack.Navigator>
  );
}
