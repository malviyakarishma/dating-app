import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [userToken, setUserToken] = useState(null);

  const authContext = {
    signIn: () => {
      // In a real app, this would involve API calls
      setUserToken('dummy-auth-token');
    },
    signOut: () => {
      setUserToken(null);
    },
    signUp: () => {
      setUserToken('dummy-auth-token');
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator userToken={userToken} signIn={authContext.signIn} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
