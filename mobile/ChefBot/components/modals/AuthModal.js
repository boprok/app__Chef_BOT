import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../../styles/AppStyles';
import GoogleAuthService from '../../services/GoogleAuthService';
import { authService } from '../../services/auth';
import { API_BASE_URL } from '../../services/api';

export const AuthModal = ({ 
  visible, 
  onClose, 
  authMode, 
  setAuthMode, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  isSubmitting, 
  onSubmit,
  isFirstTimeUser,
  onAuth // Aggiungiamo questa prop per gestire l'autenticazione
}) => {
  const insets = useSafeAreaInsets();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Effettua il sign-in con Google
      const googleUser = await GoogleAuthService.signIn();
      
      // Invia i dati a backend per verifica/creazione account
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.googleId,
          idToken: googleUser.idToken,
          picture: googleUser.picture,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Salva token usando authService (questo gestirà anche AUTH_TYPE_KEY)
        await authService.storeTokens(data.token, data.refresh_token);
        await authService.googleLogin(googleUser); // Track as Google login
        
        // Chiama la callback di autenticazione
        if (onAuth) {
          onAuth(data.user);
        }
        
        // Chiudi il modal
        onClose();
        
        Alert.alert('Success', 'Welcome to Chef Bot!');
      } else {
        Alert.alert('Error', data.error || 'Google sign-in failed');
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      Alert.alert('Error', error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[
        isFirstTimeUser ? styles.transparentModalOverlay : styles.modalOverlay,
        { paddingTop: insets.top, paddingBottom: insets.bottom }
      ]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.authModalContainer}>
            {!isFirstTimeUser && (
              <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.authModalTitle}>
              {authMode === 'login' ? 'Welcome Back!' : 'Join Chef Bot'}
            </Text>
            <Text style={styles.authModalSubtitle}>
              {authMode === 'login' 
                ? 'Sign in to access your saved recipes and preferences' 
                : 'Create your account to start cooking smarter'
              }
            </Text>
            
            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleSignInButton}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleSignInText}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.authDivider}>
              <View style={styles.authDividerLine} />
              <Text style={styles.authDividerText}>or</Text>
              <View style={styles.authDividerLine} />
            </View>
            
            <TextInput
              style={styles.authInput}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.authInput}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity
              style={styles.authButton}
              onPress={onSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.authButtonText}>
                {isSubmitting 
                  ? (authMode === 'login' ? 'Signing In...' : 'Creating Account...') 
                  : (authMode === 'login' ? 'Sign In' : 'Create Account')
                }
              </Text>
            </TouchableOpacity>
            
            <View style={styles.authSwitchContainer}>
              <Text style={styles.authSwitchText}>
                {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity 
                style={styles.authSwitchButton}
                onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              >
                <Text style={styles.authSwitchButtonText}>
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
