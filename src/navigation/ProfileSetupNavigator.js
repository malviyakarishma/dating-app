import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileSetupScreen from '../screens/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

export default function ProfileSetupNavigator() {
  return (
    <Stack.Navigator initialRouteName="ProfileSetup" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0507' } }}>
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
