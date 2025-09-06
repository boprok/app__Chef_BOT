import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

class GoogleAuthService {
  constructor() {
    this.configured = false;
  }

  configure() {
    if (!this.configured) {
      // Get client IDs from environment variables
      const androidClientId = Constants.expoConfig?.extra?.googleClientIdAndroid;
      const iosClientId = Constants.expoConfig?.extra?.googleClientIdIos;
      
      console.log('🔧 Configuring Google Auth for', Platform.OS);
      console.log('📱 Android Client ID available:', !!androidClientId);
      console.log('🍎 iOS Client ID available:', !!iosClientId);
      
      GoogleSignin.configure({
        webClientId: iosClientId, // Use iOS client ID for web
        offlineAccess: true,
        hostedDomain: '', // Restrict to specific domain if needed
        forceCodeForRefreshToken: true,
        // Add iOS-specific config
        ...(Platform.OS === 'ios' && iosClientId && {
          iosClientId: iosClientId,
        }),
        // Add Android-specific config  
        ...(Platform.OS === 'android' && androidClientId && {
          androidClientId: androidClientId,
        }),
      });
      this.configured = true;
      console.log(`✅ Google Auth configured securely for ${Platform.OS}`);
    }
  }

  async signIn() {
    try {
      this.configure();
      
      // Verifica se Google Play Services sono disponibili (Android)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Effettua il sign-in
      const userInfo = await GoogleSignin.signIn();
      
      return {
        email: userInfo.user.email,
        name: userInfo.user.name,
        picture: userInfo.user.photo,
        googleId: userInfo.user.id,
        idToken: userInfo.idToken,
        accessToken: userInfo.accessToken,
      };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      // Gestisci diversi tipi di errore
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign-in cancelled by user');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Sign-in already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      } else {
        throw new Error(`Google Sign-In failed: ${error.message}`);
      }
    }
  }

  async signOut() {
    try {
      this.configure();
      await GoogleSignin.signOut();
      console.log('Google sign out successful');
    } catch (error) {
      console.error('Google sign out error:', error);
    }
  }

  async revokeAccess() {
    try {
      this.configure();
      await GoogleSignin.revokeAccess();
      console.log('Google access revoked');
    } catch (error) {
      console.error('Google revoke access error:', error);
    }
  }

  async getCurrentUser() {
    try {
      this.configure();
      const userInfo = await GoogleSignin.signInSilently();
      return userInfo.user;
    } catch (error) {
      console.log('No user currently signed in');
      return null;
    }
  }

  async isSignedIn() {
    try {
      this.configure();
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      return false;
    }
  }
}

export default new GoogleAuthService();
