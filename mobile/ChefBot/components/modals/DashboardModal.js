
import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { styles } from '../../styles/AppStyles';
import { upgradeIconSvg } from '../../assets/svgIcons';

export const DashboardModal = ({
  visible,
  onClose,
  user,
  onUpgrade,
  onLogout,
  userProfile,
  loading,
  error,
  refreshUserProfile
}) => {

  // Calculate statistics based on real API data
  const getStats = () => {
    if (!userProfile) return null;
    const userTier = userProfile.plan === 'plus' ? 'pro' : 'free';
    // Prefer recipes_left if present (backend now provides it for free users)
    if (userTier === 'free') {
      return {
        monthlyRecipesLeft: userProfile.recipes_left ?? 0,
        tier: 'free'
      };
    } else {
      return {
        monthlyRecipes: userProfile.monthly_usage || 0,
        totalRecipes: userProfile.total_recipes || 0,
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
              <TouchableOpacity onPress={refreshUserProfile} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              {error && error.includes('login again') && (
                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                    onLogout();
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
