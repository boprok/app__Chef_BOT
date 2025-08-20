import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SvgXml } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/AppStyles';
import { logoSvg } from '../assets/svgIcons';

export const SplashScreen = () => {
  return (
    <SafeAreaView style={styles.splashContainer} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.splashContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <SvgXml xml={logoSvg} width="120" height="120" />
        </View>
        
        {/* App Name */}
        <Text style={styles.splashTitle}>Chef Bot</Text>
        <Text style={styles.splashSubtitle}>Your AI Cooking Assistant</Text>
        
        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
          <Text style={styles.loadingText}>Preparing your kitchen...</Text>
        </View>
      </View>
      
      {/* Bottom Tagline */}
      <View style={styles.splashBottom}>
        <Text style={styles.tagline}>Turn ingredients into dinner, fast.</Text>
      </View>
    </SafeAreaView>
  );
};
