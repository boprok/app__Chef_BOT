import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { styles } from '../styles/AppStyles';
import { logoSvg } from '../assets/svgIcons';

export const Header = ({ 
  isAuthenticated, 
  onLoginPress, 
  onProfilePress, 
  onGoProPress,
  showBackButton = false,
  onBackPress
}) => {
  const logoOpacity = useRef(new Animated.Value(showBackButton ? 0 : 1)).current;
  const backOpacity = useRef(new Animated.Value(showBackButton ? 1 : 0)).current;

  useEffect(() => {
    // Small delay to ensure smooth transition after page change
    const timeoutId = setTimeout(() => {
      if (showBackButton) {
        // Animate to show back button
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(backOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Animate to show logo
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(backOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, 50); // Small delay for smoother transition

    return () => clearTimeout(timeoutId);
  }, [showBackButton]);

  return (
    <View style={styles.header}>
      {/* Left side - Logo or Back button with transition */}
      <View style={styles.menuLogoContainer}>
        {/* Logo with fade animation */}
        <Animated.View style={{ 
          opacity: logoOpacity,
          position: showBackButton ? 'absolute' : 'relative'
        }}>
          <Image 
            source={require('../assets/ChefBot_Textlogo/Chef BOT-3.png')} 
            style={styles.menuLogo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Back button with fade animation */}
        <Animated.View style={{ 
          opacity: backOpacity,
          position: showBackButton ? 'relative' : 'absolute'
        }}>
          <TouchableOpacity 
            style={{ padding: 8, marginLeft: -8 }} 
            onPress={onBackPress}
            disabled={!showBackButton}
          >
            <Text style={{ color: '#2ba84a', fontSize: 20, fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>
        </Animated.View>
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
