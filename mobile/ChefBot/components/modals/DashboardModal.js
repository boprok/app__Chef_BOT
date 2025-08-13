import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { styles } from '../styles/AppStyles';
import { upgradeIconSvg } from '../assets/svgIcons';

export const DashboardModal = ({ 
  visible, 
  onClose, 
  user, 
  onUpgrade, 
  onLogout 
}) => {
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
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Recipes Created</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <View style={styles.upgradeButtonContent}>
              <SvgXml xml={upgradeIconSvg} width="28" height="28" />
              <Text style={styles.upgradeButtonText}>Upgrade to PRO</Text>
            </View>
          </TouchableOpacity>
          
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
