import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { styles } from '../styles/AppStyles';

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
  isFirstTimeUser 
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={isFirstTimeUser ? styles.transparentModalOverlay : styles.modalOverlay}>
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
