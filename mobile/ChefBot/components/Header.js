import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { styles } from '../styles/AppStyles';
import { logoSvg } from '../assets/svgIcons';

export const Header = ({ onDashboardPress, onGoProPress }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onDashboardPress}>
        <Text style={styles.dashboardButtonIcon}>☰</Text>
      </TouchableOpacity>
      
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={styles.goProButton}
          onPress={onGoProPress}
        >
          <Text style={styles.goProButtonText}>Go Pro!</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDashboardPress} style={styles.logoContainer}>
          <SvgXml xml={logoSvg} width="32" height="32" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
