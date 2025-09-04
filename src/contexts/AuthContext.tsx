import React, { createContext, useContext, useEffect, useState } from 'react';
import pb from '../config/pocketbase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(pb.authStore.model ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from current auth state
    setUser(pb.authStore.model ?? null);
    setLoading(false);

    // Subscribe to auth changes
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(pb.authStore.model ?? null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


