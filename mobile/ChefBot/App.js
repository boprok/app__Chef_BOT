import { useState, useEffect } from 'react';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput, 
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BlurView } from 'expo-blur';
// import { CameraView, Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { authService } from './services/auth';
import { colors, commonStyles } from './constants/Colors';

// Your Chef Bot logo SVG
const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Chef Bot logo">
  <!-- Background with smoother corners -->
  <rect x="0" y="0" width="64" height="64" rx="16" ry="16" fill="#000000"/>

  <!-- Chef Hat -->
  <g transform="translate(12,6)">
    <!-- Puffy top (three circles with better blending) -->
    <circle cx="14" cy="10" r="6" fill="#f7f9f8"/>
    <circle cx="24" cy="8" r="7" fill="#f7f9f8"/>
    <circle cx="34" cy="10" r="6" fill="#f7f9f8"/>
    <!-- Hat band with smoother corners -->
    <rect x="8" y="12" width="32" height="8" rx="6" fill="#e06d06"/>
    <!-- Subtle hat shadow -->
    <ellipse cx="24" cy="21" rx="16" ry="2" fill="#000" opacity="0.1"/>
  </g>

  <!-- Robot Head -->
  <g transform="translate(12,26)">
    <!-- Head shape with smoother corners -->
    <rect x="0" y="0" width="40" height="26" rx="12" fill="#2ba84a"/>
    <!-- Eyes with subtle glow -->
    <circle cx="13" cy="12" r="4" fill="#f7f9f8" opacity="0.9"/>
    <circle cx="27" cy="12" r="4" fill="#f7f9f8" opacity="0.9"/>
    <circle cx="13" cy="12" r="2.5" fill="#000000"/>
    <circle cx="27" cy="12" r="2.5" fill="#000000"/>
    <!-- Eye highlights -->
    <circle cx="14" cy="11" r="0.8" fill="#ffffff" opacity="0.8"/>
    <circle cx="28" cy="11" r="0.8" fill="#ffffff" opacity="0.8"/>
    <!-- Mouth with rounded ends -->
    <rect x="14" y="18" width="12" height="3" rx="1.5" fill="#b26700"/>
    <!-- Accent bolts with glow -->
    <circle cx="3" cy="13" r="2" fill="#ffc53a" opacity="0.9"/>
    <circle cx="37" cy="13" r="2" fill="#ffc53a" opacity="0.9"/>
    <circle cx="3" cy="13" r="1" fill="#ffd700"/>
    <circle cx="37" cy="13" r="1" fill="#ffd700"/>
  </g>
</svg>
`;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGoProModal, setShowGoProModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showGoProPageModal, setShowGoProPageModal] = useState(false);
  
  // Camera states
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    // getCameraPermissions();
  }, []);

  // Handle first-time user flow
  useEffect(() => {
    if (!isLoading && isFirstTimeUser && !isAuthenticated) {
      // Automatically open signup modal for first-time users
      openAuthModal('signup');
    }
  }, [isLoading, isFirstTimeUser, isAuthenticated]);

  const getCameraPermissions = async () => {
    // const { status } = await Camera.requestCameraPermissionsAsync();
    // setHasCameraPermission(status === 'granted');
    setHasCameraPermission(true); // Temporary - assume granted
  };

  const checkAuthStatus = async () => {
    try {
      // Show splash screen for at least 2 seconds
      const authPromise = authService.initializeAuth();
      const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      const authenticated = await authPromise;
      if (authenticated) {
        const userData = await authService.getUser();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Check if this is a first-time user (no token ever stored)
        const hasEverHadToken = await authService.getToken();
        const hasEverHadUser = await authService.getUser();
        
        // If no token and no user data, it's a first-time user
        if (!hasEverHadToken && !hasEverHadUser) {
          setIsFirstTimeUser(true);
        }
      }
      
      // Wait for minimum time
      await minTimePromise;
    } catch (error) {
      console.error('Auth check failed:', error);
      // Still wait minimum time even on error
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Assume first-time user on error
      setIsFirstTimeUser(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Modal Functions
  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setEmail('');
    setPassword('');
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    // Prevent closing for first-time users who must complete signup
    if (isFirstTimeUser && authMode === 'signup') {
      return; // Don't allow closing
    }
    
    setShowAuthModal(false);
    setEmail('');
    setPassword('');
    setIsSubmitting(false);
    
    // If it was a first-time user closing signup modal, 
    // they're no longer considered first-time for this session
    if (isFirstTimeUser && authMode === 'signup') {
      setIsFirstTimeUser(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const response = await authService.login(email, password);
        setUser(response.user);
        setIsAuthenticated(true);
        closeAuthModal();
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        const response = await authService.signup(email, password);
        setUser(response.user);
        setIsAuthenticated(true);
        setIsFirstTimeUser(false); // No longer a first-time user
        closeAuthModal();
        Alert.alert('Success', 'Welcome to Chef Bot! Account created successfully!');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      ]
    );
  };

  // Camera Modal Functions
  const openCameraModal = () => {
    if (hasCameraPermission === false) {
      Alert.alert('No Camera Access', 'Please enable camera permissions to take photos');
      return;
    }
    setShowCameraModal(true);
  };

  const takePicture = async () => {
    if (camera) {
      const photo = await camera.takePictureAsync();
      setCapturedImage(photo.uri);
      setShowCameraModal(false);
      analyzeImage(photo.uri);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      setShowCameraModal(false);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (imageUri) => {
    setIsAnalyzing(true);
    try {
      // Here you would send the image to your API for analysis
      // For now, we'll simulate the analysis
      setTimeout(() => {
        setAnalysisResult({
          ingredients: ['Tomatoes', 'Onions', 'Cheese', 'Lettuce', 'Bread'],
          recipes: [
            {
              name: 'Grilled Cheese Sandwich',
              time: '10 minutes',
              difficulty: 'Easy',
              ingredients: ['Bread', 'Cheese'],
              steps: ['Heat pan', 'Butter bread', 'Add cheese', 'Grill until golden']
            },
            {
              name: 'Fresh Garden Salad',
              time: '5 minutes', 
              difficulty: 'Easy',
              ingredients: ['Lettuce', 'Tomatoes', 'Onions'],
              steps: ['Wash vegetables', 'Chop ingredients', 'Mix in bowl', 'Add dressing']
            }
          ]
        });
        setIsAnalyzing(false);
        setShowAnalysisModal(true);
      }, 2000);
    } catch (error) {
      Alert.alert('Analysis Failed', 'Unable to analyze image. Please try again.');
      setIsAnalyzing(false);
    }
  };

  // Profile Modal Functions
  const openProfileModal = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setShowProfileModal(true);
  };

  // Dashboard Modal Functions (when clicking logo)
  const openDashboardModal = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setShowDashboardModal(true);
  };

  // Go Pro Modal Functions
  const openGoProModal = () => {
    setShowGoProModal(true);
  };

  // Go Pro Page Modal Functions
  const openGoProPageModal = () => {
    setShowGoProPageModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <View style={styles.splashContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <SvgXml xml={logoSvg} width="120" height="120" />
          </View>
          
          {/* App Name */}
          <Text style={styles.splashTitle}>Chef Bot</Text>
          <Text style={styles.splashSubtitle}>Your AI Cooking Assistant</Text>
          
          {/* Loading Animation */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
            <Text style={styles.loadingText}>Preparing your kitchen...</Text>
          </View>
        </View>
        
        {/* Bottom Tagline */}
        <View style={styles.splashBottom}>
          <Text style={styles.tagline}>Turn ingredients into dinner, fast.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Main App Content */}
      <SafeAreaView style={commonStyles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDashboardModal}>
          <SvgXml xml={logoSvg} width="80" height="80" />
        </TouchableOpacity>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.goProButton}
            onPress={openGoProModal}
          >
            <Text style={styles.goProButtonText}>Go Pro!</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={openProfileModal}
          >
            <Text style={styles.profileButtonText}>
              {isAuthenticated ? user?.email?.split('@')[0] || 'Profile' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Why Chef Bot Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Why Chef Bot</Text>
          <Text style={styles.sectionDescription}>
            You already have ingredients at home. Chef Bot helps you turn them into dinner—fast.
          </Text>
          <Text style={styles.sectionSubtext}>
            Point your camera, add a preference if you want (vegetarian, 15 minutes, high-protein), and we'll generate clear, step-by-step recipes sized to your time and pantry. No sign-in for the demo, no clutter, just results.
          </Text>

          {/* Feature Cards Row 1 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScrollContainer}>
            <View style={styles.featureCard}>
              <Text style={styles.cardIcon}>⚡</Text>
              <Text style={styles.cardTitle}>Instant ideas</Text>
              <Text style={styles.cardDescription}>
                One photo in, 3–5 recipes out. Get ingredient lists, substitutions, and clear steps with realistic timing.
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.cardIcon}>🎯</Text>
              <Text style={styles.cardTitle}>Smart preferences</Text>
              <Text style={styles.cardDescription}>
                Add notes like "vegetarian", "15 min", or "high protein". Chef Bot adapts servings, methods, and flavors automatically.
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.cardIcon}>🔒</Text>
              <Text style={styles.cardTitle}>Private & light</Text>
              <Text style={styles.cardDescription}>
                No sign-up for the demo. Your image is used only to analyze and suggest recipes. It's fast and built for your phone.
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* How it works Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>How it works</Text>
          
          {/* How-to Cards Row 2 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScrollContainer}>
            <View style={styles.howToCard}>
              <Text style={styles.stepNumber}>1)</Text>
              <Text style={styles.cardTitle}>Snap your fridge</Text>
              <Text style={styles.cardDescription}>
                Take a clear photo of your fridge or ingredients. The better the lighting, the more accurate the suggestions.
              </Text>
            </View>
            
            <View style={styles.howToCard}>
              <Text style={styles.stepNumber}>2)</Text>
              <Text style={styles.cardTitle}>Tell us your vibe</Text>
              <Text style={styles.cardDescription}>
                Optional: diet, time, cuisine. Add quick notes like "spicy", "gluten-free", or "15 minutes" to tailor results.
              </Text>
            </View>
            
            <View style={styles.howToCard}>
              <Text style={styles.stepNumber}>3)</Text>
              <Text style={styles.cardTitle}>Cook in minutes</Text>
              <Text style={styles.cardDescription}>
                Receive concise recipes with ingredients, substitutions, and step-by-step instructions—ready to cook now.
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={openCameraModal}
          >
            <Text style={styles.primaryButtonText}>Start Cooking</Text>
          </TouchableOpacity>

          {!isAuthenticated && (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => openAuthModal('login')}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Auth Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAuthModal}
        onRequestClose={isFirstTimeUser ? () => {} : closeAuthModal} // Prevent dismissal for first-time users
      >
        <Pressable 
          style={[
            isFirstTimeUser ? styles.transparentModalOverlay : styles.modalOverlay
          ]} 
          onPress={isFirstTimeUser ? () => {} : closeAuthModal} // Prevent dismissal for first-time users
        >
          <View style={styles.authModalContainer}>
            <Pressable onPress={() => {}} style={styles.authModalContent}>
              {/* Close button - only show for non-first-time users */}
              {!isFirstTimeUser && (
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={closeAuthModal}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              )}
              
              <Text style={styles.authModalTitle}>
                {authMode === 'login' ? 'Welcome Back' : 'Join Chef Bot'}
              </Text>
              <Text style={styles.authModalSubtitle}>
                {authMode === 'login' 
                  ? 'Sign in to save your recipes and preferences'
                  : isFirstTimeUser 
                    ? 'Create your account to start cooking with AI'
                    : 'Create an account to get personalized recipe recommendations'
                }
              </Text>

              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.authForm}
              >
                <TextInput
                  style={styles.authInput}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <TextInput
                  style={styles.authInput}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity 
                  style={[styles.authButton, isSubmitting && styles.authButtonDisabled]}
                  onPress={handleAuth}
                  disabled={isSubmitting}
                >
                  <Text style={styles.authButtonText}>
                    {isSubmitting ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                  </Text>
                </TouchableOpacity>

                {/* Only show switch option for non-first-time users */}
                {!isFirstTimeUser && (
                  <TouchableOpacity 
                    style={styles.authSwitchButton}
                    onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  >
                    <Text style={styles.authSwitchText}>
                      {authMode === 'login' 
                        ? "Don't have an account? Sign up" 
                        : "Already have an account? Sign in"
                      }
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* First-time user message */}
                {isFirstTimeUser && (
                  <View style={styles.firstTimeUserMessage}>
                    <Text style={styles.firstTimeUserText}>
                      Welcome to Chef Bot! Please create your account to continue.
                    </Text>
                  </View>
                )}
              </KeyboardAvoidingView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Go Pro Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGoProModal}
        onRequestClose={() => setShowGoProModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGoProModal(false)}>
          <View style={styles.proModalContainer}>
            <Pressable onPress={() => {}} style={styles.proModalContent}>
              <Text style={styles.proModalTitle}>🚀 Upgrade to Chef Bot Pro</Text>
              
              <View style={styles.proFeaturesList}>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>✨</Text>
                  <Text style={styles.proFeatureText}>Unlimited recipe generations</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>🍳</Text>
                  <Text style={styles.proFeatureText}>Advanced dietary preferences</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>📱</Text>
                  <Text style={styles.proFeatureText}>Save recipes to your collection</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>🛒</Text>
                  <Text style={styles.proFeatureText}>Smart shopping lists</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>⚡</Text>
                  <Text style={styles.proFeatureText}>Priority AI processing</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.proButton} onPress={() => {
                Alert.alert('Coming Soon', 'Pro subscription will be available soon!');
              }}>
                <Text style={styles.proButtonText}>Coming Soon - $4.99/month</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.proCloseButton}
                onPress={() => setShowGoProModal(false)}
              >
                <Text style={styles.proCloseText}>Maybe Later</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showCameraModal}
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.cameraContainer}>
          <View style={styles.camera}>
            <Text style={styles.cameraPlaceholder}>📱 Camera Preview</Text>
            <Text style={styles.cameraSubtext}>Camera functionality temporarily disabled</Text>
            <View style={styles.cameraButtonContainer}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={takePicture}
              >
                <Text style={styles.cameraButtonText}>📸</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImage}
              >
                <Text style={styles.galleryButtonText}>🖼️</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCameraModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAnalysisModal}
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.analysisModalContainer}>
            <ScrollView style={styles.analysisModalContent}>
              <Text style={styles.analysisTitle}>🍳 Recipe Analysis</Text>
              
              {capturedImage && (
                <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
              )}
              
              {isAnalyzing ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Analyzing your ingredients...</Text>
                </View>
              ) : analysisResult && (
                <>
                  <Text style={styles.sectionTitle}>Detected Ingredients:</Text>
                  <View style={styles.ingredientsList}>
                    {analysisResult.ingredients.map((ingredient, index) => (
                      <Text key={index} style={styles.ingredientItem}>• {ingredient}</Text>
                    ))}
                  </View>
                  
                  <Text style={styles.sectionTitle}>Suggested Recipes:</Text>
                  {analysisResult.recipes.map((recipe, index) => (
                    <View key={index} style={styles.recipeCard}>
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <Text style={styles.recipeDetails}>⏱️ {recipe.time} • 📊 {recipe.difficulty}</Text>
                      <Text style={styles.recipeSteps}>
                        {recipe.steps.map((step, stepIndex) => `${stepIndex + 1}. ${step}`).join('\n')}
                      </Text>
                    </View>
                  ))}
                </>
              )}
              
              <TouchableOpacity
                style={styles.analysisCloseButton}
                onPress={() => setShowAnalysisModal(false)}
              >
                <Text style={styles.analysisCloseText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dashboard Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDashboardModal}
        onRequestClose={() => setShowDashboardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dashboardModalContainer}>
            <View style={styles.dashboardModalContent}>
              <Text style={styles.dashboardTitle}>👨‍🍳 Dashboard</Text>
              
              {user && (
                <>
                  <View style={styles.userInfo}>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.planBadge}>
                      <Text style={styles.planText}>
                        {user.plan === 'pro' ? '⭐ PRO' : '🆓 FREE'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{user.monthly_usage || 0}</Text>
                      <Text style={styles.statLabel}>Recipes Generated</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{user.plan === 'pro' ? '∞' : '10'}</Text>
                      <Text style={styles.statLabel}>Monthly Limit</Text>
                    </View>
                  </View>
                  
                  {user.plan !== 'pro' && (
                    <TouchableOpacity
                      style={styles.upgradeButton}
                      onPress={() => {
                        setShowDashboardModal(false);
                        openGoProPageModal();
                      }}
                    >
                      <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              
              <TouchableOpacity
                style={styles.dashboardCloseButton}
                onPress={() => setShowDashboardModal(false)}
              >
                <Text style={styles.dashboardCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Go Pro Page Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGoProPageModal}
        onRequestClose={() => setShowGoProPageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.goProPageContainer}>
            <ScrollView style={styles.goProPageContent}>
              <Text style={styles.goProPageTitle}>🚀 Chef Bot Pro</Text>
              <Text style={styles.goProPageSubtitle}>Unlock the full potential of AI cooking</Text>
              
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTitle}>Monthly Plan</Text>
                <Text style={styles.pricingPrice}>$4.99</Text>
                <Text style={styles.pricingPeriod}>per month</Text>
              </View>
              
              <View style={styles.proFeaturesList}>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>✨</Text>
                  <Text style={styles.proFeatureText}>Unlimited recipe generations</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>🍳</Text>
                  <Text style={styles.proFeatureText}>Advanced dietary preferences</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>📱</Text>
                  <Text style={styles.proFeatureText}>Save recipes to your collection</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>🛒</Text>
                  <Text style={styles.proFeatureText}>Smart shopping lists</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>⚡</Text>
                  <Text style={styles.proFeatureText}>Priority AI processing</Text>
                </View>
                <View style={styles.proFeature}>
                  <Text style={styles.proFeatureIcon}>🎯</Text>
                  <Text style={styles.proFeatureText}>Nutritional analysis</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => Alert.alert('Coming Soon', 'Subscription payments will be available soon!')}
              >
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.goProPageCloseButton}
                onPress={() => setShowGoProPageModal(false)}
              >
                <Text style={styles.goProPageCloseText}>Maybe Later</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.profileModalContainer}>
          <View style={styles.profileModalContent}>
            <Text style={styles.profileModalTitle}>Profile</Text>
            {user && (
              <Text style={styles.profileEmailText}>
                Logged in as: {user.email}
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.profileCloseButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.profileCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  goProButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goProButtonText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  profileButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  profileButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 12,
  },
  sectionSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 30,
  },
  cardScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  featureCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    marginRight: 16,
    width: 180,
    borderWidth: 1,
    borderColor: colors.border,
  },
  howToCard: {
    backgroundColor: colors.surfaceVariant,
    padding: 24,
    borderRadius: 16,
    marginRight: 16,
    width: 180,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent for first-time users since blur handles background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalCloseText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  authModalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  authModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  authModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  authModalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  authForm: {
    gap: 16,
  },
  authInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
  },
  authButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  authSwitchButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  authSwitchText: {
    color: colors.primary,
    fontSize: 14,
  },
  firstTimeUserMessage: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  firstTimeUserText: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  proModalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  proModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  proModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  proFeaturesList: {
    gap: 16,
    marginBottom: 32,
  },
  proFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proFeatureIcon: {
    fontSize: 20,
  },
  proFeatureText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  proButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  proButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  proCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  proCloseText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  cameraModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraModalContent: {
    padding: 32,
    alignItems: 'center',
  },
  cameraModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  cameraModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  cameraCloseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cameraCloseText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  profileModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  profileModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  profileEmailText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButtonText: {
    color: colors.onSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  profileCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileCloseText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    color: '#2ba84a',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cameraSubtext: {
    color: '#888',
    fontSize: 16,
    marginBottom: 40,
  },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  cameraButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonText: {
    fontSize: 30,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Analysis modal styles
  analysisModalContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  analysisModalContent: {
    padding: 20,
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  ingredientsList: {
    marginBottom: 20,
  },
  ingredientItem: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  recipeCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  recipeDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  recipeSteps: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  analysisCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  analysisCloseText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Dashboard modal styles
  dashboardModalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  dashboardModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userEmail: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dashboardCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dashboardCloseText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  // Go Pro Page styles
  goProPageContainer: {
    width: '95%',
    maxHeight: '90%',
  },
  goProPageContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  goProPageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  goProPageSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  pricingCard: {
    backgroundColor: colors.primary,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 18,
    color: colors.onPrimary,
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  pricingPeriod: {
    fontSize: 16,
    color: colors.onPrimary,
    opacity: 0.8,
  },
  subscribeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  subscribeButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  goProPageCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  goProPageCloseText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 60,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  splashBottom: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '500',
    textAlign: 'center',
  },
});
