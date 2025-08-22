import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';
import { Platform } from 'react-native';

const TOKEN_KEY = 'chef_bot_token';
const REFRESH_TOKEN_KEY = 'chef_bot_refresh_token';
const USER_KEY = 'chef_bot_user';
const TOKEN_EXPIRY_KEY = 'chef_bot_token_expiry';
const DEVICE_ID_KEY = 'chef_bot_device_id';

// Generate or get device ID
const getDeviceId = async () => {
  try {
    // Try to get stored device ID first
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID using available identifiers
      const platform = Platform.OS;
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      
      deviceId = `${platform}-${timestamp}-${random}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Failed to get/generate device ID:', error);
    // Fallback to timestamp-based ID
    const fallbackId = `${Platform.OS}-fallback-${Date.now()}`;
    return fallbackId;
  }
};

export const authService = {
  // Login and store tokens
  async login(email, password) {
    try {
      const deviceId = await getDeviceId();
      const deviceInfo = {
        device_id: deviceId,
        device_name: `${Platform.OS} Device`,
        platform: Platform.OS
      };
      
      // Try secure login first
      try {
        console.log('Attempting secure login...');
        const response = await authAPI.secureLogin(email, password, deviceInfo);
        await this.storeTokens(response.token, response.refresh_token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
        authAPI.setToken(response.token);
        console.log('Secure login successful');
        return response;
      } catch (secureError) {
        console.warn('Secure login failed, falling back to regular login:', secureError.message);
        
        // Fallback to regular login
        const response = await authAPI.login(email, password);
        await this.storeTokens(response.token, response.refresh_token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
        authAPI.setToken(response.token);
        console.log('Regular login successful');
        return response;
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Signup and store tokens
  async signup(email, password) {
    try {
      const response = await authAPI.signup(email, password);
      await this.storeTokens(response.token, response.refresh_token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
      authAPI.setToken(response.token);
      return response;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  },

  // Store tokens with expiry calculation
  async storeTokens(accessToken, refreshToken) {
    try {
      // Calculate expiry time (24 hours from now)
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  },

  // Check if token is expired
  async isTokenExpired() {
    try {
      const expiryTime = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;
      
      return Date.now() > parseInt(expiryTime);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  },

  // Refresh access token
  async refreshAccessToken() {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        console.log('No refresh token available, clearing auth state...');
        await this.logout();
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(refreshToken);
      await this.storeTokens(response.token, response.refresh_token);
      authAPI.setToken(response.token);
      
      return response.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await this.logout();
      throw error;
    }
  },

  // Get valid token (refresh if needed)
  async getValidToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.log('No access token found');
        return null;
      }

      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        console.log('Token expired, attempting refresh...');
        try {
          return await this.refreshAccessToken();
        } catch (refreshError) {
          console.log('Refresh failed, user needs to login again');
          return null;
        }
      }

      return token;
    } catch (error) {
      console.error('Failed to get valid token:', error);
      return null;
    }
  },

  // Logout and clear storage
  async logout() {
    try {
      // Get refresh token before clearing storage
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      // Call server logout endpoint if we have a refresh token
      if (refreshToken) {
        try {
          await authAPI.logout(refreshToken);
        } catch (error) {
          // Don't fail logout if server call fails
          console.warn('Server logout failed, proceeding with local logout:', error);
        }
      }
      
      // Clear local storage
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      authAPI.setToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  // Get stored token (use getValidToken instead for automatic refresh)
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },

  // Get stored user data
  async getUser() {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await this.getValidToken();
    return !!token;
  },

  // Initialize auth state (call on app start)
  async initializeAuth() {
    try {
      const token = await this.getValidToken();
      if (token) {
        authAPI.setToken(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      return false;
    }
  },

  // Refresh user profile
  async refreshProfile() {
    try {
      const profile = await authAPI.getProfile();
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      throw error;
    }
  },
};

