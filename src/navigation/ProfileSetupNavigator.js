import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileSetupStep1Screen from '../screens/ProfileSetupStep1Screen';
import ProfileSetupStep2Screen from '../screens/ProfileSetupStep2Screen';
import ProfileSetupStep3Screen from '../screens/ProfileSetupStep3Screen';

const Stack = createNativeStackNavigator();

export default function ProfileSetupNavigator() {
  return (
    <Stack.Navigator initialRouteName="ProfileSetupStep1" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0507' } }}>
      <Stack.Screen name="ProfileSetupStep1" component={ProfileSetupStep1Screen} />
      <Stack.Screen name="ProfileSetupStep2" component={ProfileSetupStep2Screen} />
      <Stack.Screen name="ProfileSetupStep3" component={ProfileSetupStep3Screen} />
    </Stack.Navigator>
  );
}
