import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useFonts, BricolageGrotesque_400Regular, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';

const DarkDatingAppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0d0507',
  },
};

export default function App() {
  let [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <KeyboardProvider>
          <NavigationContainer theme={DarkDatingAppTheme}>
            <RootNavigator />
          </NavigationContainer>
        </KeyboardProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
