import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { styles } from '../../styles/AppStyles';
import { proBadgeSvg } from '../../assets/svgIcons';

export const GoProPageModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.goProPageContainer}>
          <View style={styles.goProPageContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
            
            <Text style={styles.goProPageTitle}>Upgrade to Chef Bot PRO</Text>
            <Text style={styles.goProPageSubtitle}>
              Unlock unlimited recipes, premium features, and personalized meal planning
            </Text>
            
            <View style={styles.pricingCard}>
              <SvgXml xml={proBadgeSvg} width="48" height="30" style={{ marginBottom: 16 }} />
              <Text style={styles.pricingTitle}>Chef Bot PRO</Text>
              <Text style={styles.pricingPrice}>$9.99</Text>
              <Text style={styles.pricingPeriod}>per month</Text>
            </View>
            
            <TouchableOpacity style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>Start Your PRO Journey</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.goProPageCloseButton} onPress={onClose}>
              <Text style={styles.goProPageCloseText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
