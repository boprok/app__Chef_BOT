import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { styles } from '../../styles/AppStyles';
import { upgradeIconSvg } from '../../assets/svgIcons';
import { authAPI } from '../../services/api';
import { authService } from '../../services/auth';

export const DashboardModal = ({ 
  visible, 
  onClose, 
  user, 
  onUpgrade, 
  onLogout 
}) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user profile data when modal opens
  useEffect(() => {
    if (visible && user) {
      fetchUserProfile();
    }
  }, [visible, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have a valid token before making the request
      const token = await authService.getToken();
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }
      
      // Set the token in the API service (in case it wasn't set)
      authAPI.setToken(token);
      
      // Fetch fresh profile data
      const profile = await authAPI.getProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      if (err.message.includes('403') || err.message.includes('Not authenticated')) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load user data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics based on real API data
  const getStats = () => {
    if (!userProfile) return null;

    const userTier = userProfile.plan === 'plus' ? 'pro' : 'free';
    const monthlyUsage = userProfile.monthly_usage || 0;
    const monthlyLimit = userProfile.monthly_limit || 10;

    if (userTier === 'free') {
      // For free users: show monthly recipes left
      const monthlyRecipesLeft = Math.max(0, monthlyLimit - monthlyUsage);
      
      return {
        monthlyRecipesLeft,
        tier: 'free'
      };
    } else {
      // For pro users: show monthly and total stats
      return {
        monthlyRecipes: monthlyUsage,
        totalRecipes: userProfile.total_recipes || 0, // This would need to be added to API
        tier: 'pro'
      };
    }
  };

  const stats = getStats();
  const userTier = userProfile?.plan === 'plus' ? 'pro' : 'free';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.dashboardModalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>×</Text>
          </TouchableOpacity>
          
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>Your culinary journey</Text>
          
          {user && (
            <Text style={styles.welcomeText}>
              Welcome back, {user.email?.split('@')[0] || 'Chef'}! 👨‍🍳
            </Text>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Loading your stats...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchUserProfile} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              {error.includes('login again') && (
                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                    onLogout(); // This will log the user out and show login screen
                  }} 
                  style={[styles.retryButton, { backgroundColor: '#FF8A80', marginTop: 8 }]}
                >
                  <Text style={styles.retryButtonText}>Login Again</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!loading && !error && stats && (
            <View style={styles.statsContainer}>
              {userTier === 'free' ? (
                // FREE TIER - Show monthly recipes left
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.monthlyRecipesLeft}</Text>
                    <Text style={styles.statLabel}>Monthly Recipes Left</Text>
                  </View>
                </>
              ) : (
                // PRO TIER - Show monthly statistics
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.monthlyRecipes}</Text>
                    <Text style={styles.statLabel}>This Month</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.totalRecipes}</Text>
                    <Text style={styles.statLabel}>Total Recipes</Text>
                  </View>
                </>
              )}
            </View>
          )}
          
          {/* Mostra upgrade button solo per utenti FREE */}
          {userTier === 'free' && (
            <TouchableOpacity 
              style={styles.upgradeButton} 
              onPress={() => {
                if (onUpgrade) {
                  onClose(); // Close dashboard modal first
                  setTimeout(() => {
                    onUpgrade(); // Then open Go Pro modal
                  }, 300); // Small delay for smooth transition
                }
              }}
            >
              <View style={styles.upgradeButtonContent}>
                <SvgXml xml={upgradeIconSvg} width="28" height="28" />
                <Text style={styles.upgradeButtonText}>Upgrade to PRO</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Badge PRO per utenti PRO */}
          {userTier === 'pro' && (
            <View style={styles.proBadgeContainer}>
              <Text style={styles.proBadgeText}>✨ PRO Member</Text>
              <Text style={styles.proBadgeSubtext}>Unlimited recipes & premium features</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.dashboardLogoutButton} onPress={onLogout}>
            <Text style={styles.dashboardLogoutText}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dashboardCloseButton} onPress={onClose}>
            <Text style={styles.dashboardCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
