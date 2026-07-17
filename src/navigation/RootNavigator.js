import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import AuthNavigator from './AuthNavigator';
import ProfileSetupNavigator from './ProfileSetupNavigator';
import TabNavigator from './TabNavigator';
import ChatDMScreen from '../screens/ChatDMScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpCentreScreen from '../screens/HelpCentreScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { userToken, user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0507' } }}>
      {userToken == null ? (
        // No token → user isn't signed in
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animationTypeForReplace: 'pop' }}
        />
      ) : !user?.isProfileComplete ? (
        // Token exists but profile is incomplete → profile setup flow
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupNavigator}
        />
      ) : (
        // Fully authenticated and profile complete → main app
        <Stack.Group>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="ChatDM" 
            component={ChatDMScreen} 
            options={{ contentStyle: { backgroundColor: '#0d0507' } }} 
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen} 
            options={{ contentStyle: { backgroundColor: '#0d0507' } }} 
          />
          <Stack.Screen 
            name="HelpCentre" 
            component={HelpCentreScreen} 
            options={{ contentStyle: { backgroundColor: '#0d0507' } }} 
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

