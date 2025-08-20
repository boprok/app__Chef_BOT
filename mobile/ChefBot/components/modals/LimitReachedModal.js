import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/AppStyles';

export const LimitReachedModal = ({ visible, onClose, onGoPro }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.goProPageContainer}>
        <View style={styles.goProPageContent}>
          <Text style={styles.goProPageTitle}>Limit Reached</Text>
          <Text style={styles.goProPageSubtitle}>
            You have reached your free plan limit for this month. Upgrade to Chef Bot PRO for unlimited analyses!
          </Text>
          <TouchableOpacity style={styles.subscribeButton} onPress={onGoPro}>
            <Text style={styles.subscribeButtonText}>Go Pro!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goProPageCloseButton} onPress={onClose}>
            <Text style={styles.goProPageCloseText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
