import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);

  const authContext = {
    userToken,
    signIn: () => {
      // In a real app, this would involve API calls
      setUserToken('dummy-auth-token');
    },
    signOut: () => {
      setUserToken(null);
    },
    signUp: () => {
      // In a real app, this would involve API calls
      setUserToken('dummy-auth-token');
    },
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
