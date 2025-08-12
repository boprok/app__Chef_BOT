import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';

const TOKEN_KEY = 'chef_bot_token';
const USER_KEY = 'chef_bot_user';

export const authService = {
  // Login and store token
  async login(email, password) {
    try {
      const response = await authAPI.login(email, password);
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
      authAPI.setToken(response.token);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Signup and store token
  async signup(email, password) {
    try {
      const response = await authAPI.signup(email, password);
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
      authAPI.setToken(response.token);
      return response;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  },

  // Logout and clear storage
  async logout() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      authAPI.setToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  // Get stored token
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
    const token = await this.getToken();
    return !!token;
  },

  // Initialize auth state (call on app start)
  async initializeAuth() {
    try {
      const token = await this.getToken();
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

