import React, { useState, useEffect, useCallback } from 'react';
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
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showGoProPageModal, setShowGoProPageModal] = useState(false);
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // User profile for dashboard
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  // Current page state
  const [currentPage, setCurrentPage] = useState('main'); // 'main' or 'recipes'
  // Recipe analysis results
  const [recipes, setRecipes] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Fetch user profile for dashboard
  const fetchUserProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const token = await authService.getToken();
      if (!token) {
        setProfileError('Authentication required. Please login again.');
        setUserProfile(null);
        return;
      }
      const { authAPI } = await import('./services/api');
      authAPI.setToken(token);
      const profile = await authAPI.getProfile();
      setUserProfile(profile);
    } catch (err) {
      setUserProfile(null);
      if (err.message && (err.message.includes('403') || err.message.includes('Not authenticated'))) {
        setProfileError('Session expired. Please login again.');
      } else {
        setProfileError('Failed to load user data');
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);

  // Handle authentication flow after splash
  useEffect(() => {
    if (authCheckComplete && !showSplash) {
      if (!isAuthenticated) {
        // Show appropriate auth modal based on user status
        if (isFirstTimeUser) {
          openAuthModal('signup');
        } else {
          openAuthModal('login');
        }
      }
    }
  }, [authCheckComplete, showSplash, isAuthenticated, isFirstTimeUser]);

  const initializeApp = async () => {
    try {
      // Show splash for minimum time to ensure good UX
      const minSplashTime = 2000; // 2 seconds minimum
      const startTime = Date.now();
      
      // Check authentication status
      await checkAuthStatus();
      
      // Ensure splash shows for minimum time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minSplashTime - elapsedTime);
      
      setTimeout(() => {
        setShowSplash(false);
      }, remainingTime);
      
    } catch (error) {
      console.error('App initialization failed:', error);
      // Still hide splash even if there's an error
      setTimeout(() => {
        setShowSplash(false);
      }, 2000);
    }
  };

  // Handle first-time user flow
  useEffect(() => {
    if (!isLoading && isFirstTimeUser && !isAuthenticated) {
      // Automatically open signup modal for first-time users
      openAuthModal('signup');
    }
  }, [isLoading, isFirstTimeUser, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      const token = await authService.getToken();
      const userData = await authService.getUser();
      
      if (token && userData) {
        // Try to validate token with server
        try {
          await authService.initializeAuth();
          setIsAuthenticated(true);
          setUser(userData);
          setIsFirstTimeUser(false);
          console.log('✅ User authenticated successfully');
        } catch (authError) {
          // Token is invalid or expired
          console.log('❌ Token validation failed:', authError.message);
          await authService.logout(); // Clear invalid tokens
          setIsAuthenticated(false);
          setUser(null);
          setIsFirstTimeUser(false); // Not first time, just needs to login again
        }
      } else {
        // No token or user data - first time user or logged out
        setIsAuthenticated(false);
        setUser(null);
        setIsFirstTimeUser(!token && !userData); // First time if no token AND no user data
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsFirstTimeUser(true);
    } finally {
      setIsLoading(false);
      setAuthCheckComplete(true);
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const openDashboardModal = () => {
    if (isAuthenticated) {
      fetchUserProfile();
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

  // Handle authentication success (both regular and Google auth)
  const handleAuthSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setIsFirstTimeUser(false);
    setShowAuthModal(false);
    setEmail('');
    setPassword('');
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

      // Backend returns {token, user} on success
      if (result.token && result.user) {
        handleAuthSuccess(result.user);
        
        Alert.alert(
          'Success!', 
          authMode === 'login' ? 'Welcome back!' : 'Account created successfully!'
        );
      } else {
        Alert.alert('Error', 'Authentication failed - Invalid response format');
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
    setAuthMode('login');
  setShowAuthModal(true);
  };

  const openProfileModal = () => {
    if (isAuthenticated) {
      setShowDashboardModal(true);
    } else {
      openAuthModal('login');
    }
  };

  // Show splash screen during initialization
  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        
        {/* Universal Header - changes based on current page */}
        <Header 
          isAuthenticated={isAuthenticated}
          onLoginPress={() => openAuthModal('login')}
          onProfilePress={openProfileModal}
          onGoProPress={openGoProModal}
          showBackButton={currentPage === 'recipes'}
          onBackPress={() => setCurrentPage('main')}
        />
        
        <MainContent 
          isAuthenticated={isAuthenticated}
          user={user}
          refreshDashboard={fetchUserProfile}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          recipes={recipes}
          setRecipes={setRecipes}
          analysisResult={analysisResult}
          setAnalysisResult={setAnalysisResult}
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
          onAuth={handleAuthSuccess}
        />

        {/* Dashboard Modal */}
        <DashboardModal
          visible={showDashboardModal}
          onClose={() => setShowDashboardModal(false)}
          user={user}
          onUpgrade={openGoProModal}
          onLogout={handleLogout}
          userProfile={userProfile}
          loading={profileLoading}
          error={profileError}
          refreshUserProfile={fetchUserProfile}
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
