import { useState, useEffect } from 'react';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  View, 
  Alert, 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { authService } from './services/auth';
import { colors, commonStyles } from './constants/Colors';

// Components
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { AuthModal } from './components/modals/AuthModal';
import { DashboardModal } from './components/modals/DashboardModal';
import { GoProPageModal } from './components/modals/GoProPageModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showGoProPageModal, setShowGoProPageModal] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle first-time user flow
  useEffect(() => {
    if (!isLoading && isFirstTimeUser && !isAuthenticated) {
      // Automatically open signup modal for first-time users
      openAuthModal('signup');
    }
  }, [isLoading, isFirstTimeUser, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const token = await authService.getToken();
      const userData = await authService.getUser();
      
      if (token && userData) {
        // Initialize the API service with the stored token
        await authService.initializeAuth();
        setIsAuthenticated(true);
        setUser(userData);
        setIsFirstTimeUser(false);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsFirstTimeUser(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsFirstTimeUser(true);
    } finally {
      setIsLoading(false);
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const openDashboardModal = () => {
    if (isAuthenticated) {
      setShowDashboardModal(true);
    } else {
      openAuthModal('login');
    }
  };

  const openGoProModal = () => {
    setShowGoProPageModal(true);
  };

  // Simple email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let result;
      if (authMode === 'login') {
        result = await authService.login(email, password);
      } else {
        result = await authService.signup(email, password);
      }

      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        setIsFirstTimeUser(false);
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        
        Alert.alert(
          'Success!', 
          authMode === 'login' ? 'Welcome back!' : 'Account created successfully!'
        );
      } else {
        Alert.alert('Error', result.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      // Parse specific error messages from the API
      if (error.message.includes('Email already registered')) {
        // Show alert with option to switch to login
        Alert.alert(
          'Email Already Registered',
          'This email is already registered. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign In', 
              onPress: () => setAuthMode('login'),
              style: 'default'
            }
          ]
        );
        return; // Don't show the generic error alert
      } else if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
        if (authMode === 'login') {
          Alert.alert(
            'Login Failed',
            'Invalid email or password. Please check your credentials and try again.',
            [
              { text: 'Try Again', style: 'default' },
              { 
                text: 'Sign Up Instead', 
                onPress: () => setAuthMode('signup'),
                style: 'cancel'
              }
            ]
          );
          return;
        } else {
          Alert.alert('Error', 'Invalid email or password. Please check your credentials and try again.');
        }
      } else if (error.message.includes('400')) {
        // Extract the specific error message from API response
        const match = error.message.match(/400 - (.+)/);
        if (match && match[1]) {
          try {
            const errorData = JSON.parse(match[1]);
            Alert.alert('Error', errorData.detail || 'Something went wrong. Please try again.');
          } catch {
            Alert.alert('Error', match[1]);
          }
        } else {
          Alert.alert('Error', 'Something went wrong. Please try again.');
        }
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        Alert.alert('Error', 'Network error. Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setShowDashboardModal(false);
    Alert.alert('Success', 'Logged out successfully');
  };

  const openProfileModal = () => {
    if (isAuthenticated) {
      setShowDashboardModal(true);
    } else {
      openAuthModal('login');
    }
  };

  // Loading screen
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        
        <Header 
          isAuthenticated={isAuthenticated}
          onLoginPress={() => openAuthModal('login')}
          onProfilePress={openProfileModal}
        />
        
        <MainContent 
          isAuthenticated={isAuthenticated}
          onSignUpPress={() => openAuthModal('signup')}
          onUpgradePress={openGoProModal}
        />

        {/* Auth Modal */}
        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          authMode={authMode}
          setAuthMode={setAuthMode}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isSubmitting={isSubmitting}
          onSubmit={handleAuth}
          isFirstTimeUser={isFirstTimeUser}
        />

        {/* Dashboard Modal */}
        <DashboardModal
          visible={showDashboardModal}
          onClose={() => setShowDashboardModal(false)}
          user={user}
          onUpgrade={openGoProModal}
          onLogout={handleLogout}
        />

        {/* Go Pro Modal */}
        <GoProPageModal
          visible={showGoProPageModal}
          onClose={() => setShowGoProPageModal(false)}
        />
        
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
