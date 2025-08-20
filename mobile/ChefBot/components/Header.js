import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { styles } from '../styles/AppStyles';
import { logoSvg } from '../assets/svgIcons';

export const Header = ({ isAuthenticated, onLoginPress, onProfilePress, onGoProPress }) => {
  return (
    <View style={styles.header}>
      <View style={styles.menuLogoContainer}>
        <Image 
          source={require('../assets/ChefBot_Textlogo/Chef BOT-3.png')} 
          style={styles.menuLogo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={styles.goProButton}
          onPress={onGoProPress}
        >
          <Text style={styles.goProButtonText}>Go Pro!</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={isAuthenticated ? onProfilePress : onLoginPress} style={styles.logoContainer}>
          <SvgXml xml={logoSvg} width="32" height="32" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
