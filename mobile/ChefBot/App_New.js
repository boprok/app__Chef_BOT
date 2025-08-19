import { useState, useEffect } from 'react';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  View, 
  Alert, 
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
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

  const openProfileModal = () => {
    if (isAuthenticated) {
      setShowDashboardModal(true);
    } else {
      openAuthModal('login');
    }
  };

  const openGoProPageModal = () => {
    setShowGoProPageModal(true);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setShowDashboardModal(false);
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const openCameraModal = () => {
    // TODO: Implement camera modal
    Alert.alert('Camera', 'Camera feature coming soon!');
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Main App Content */}
      <SafeAreaView style={commonStyles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
        <Header 
          onDashboardPress={openDashboardModal}
          onGoProPress={openGoProModal}
        />

        {/* Main Content */}
        <MainContent 
          onStartCooking={openCameraModal}
          onOpenProfile={openProfileModal}
          isAuthenticated={isAuthenticated}
          user={user}
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
          onUpgrade={openGoProPageModal}
          onLogout={handleLogout}
        />

        {/* Go Pro Page Modal */}
        <GoProPageModal 
          visible={showGoProPageModal}
          onClose={() => setShowGoProPageModal(false)}
        />
      </SafeAreaView>

      {/* Blur Overlay for First-Time Users */}
      {isFirstTimeUser && showAuthModal && (
        <BlurView 
          intensity={80} 
          style={StyleSheet.absoluteFillObject}
          tint="dark"
        />
      )}
    </View>
  );
}
