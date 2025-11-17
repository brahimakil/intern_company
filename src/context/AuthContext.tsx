import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { companyApi } from '../services/api';
import type { AuthContextType, Company, RegisterData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('companyToken', token);
          
          // Get company data from backend
          const response = await companyApi.login(token);
          setCompany(response.company);
        } catch (error) {
          console.error('Error fetching company data:', error);
          setCompany(null);
          localStorage.removeItem('companyToken');
        }
      } else {
        setCompany(null);
        localStorage.removeItem('companyToken');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (data: RegisterData) => {
    try {
      // Register company via backend (logoUrl will be empty initially)
      await companyApi.register(data);
      
      // Note: User is NOT logged in automatically after registration
      // They need to wait for admin approval
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('companyToken', token);
      
      // Verify company exists in backend
      const response = await companyApi.login(token);
      setCompany(response.company);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCompany(null);
      localStorage.removeItem('companyToken');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ company, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
