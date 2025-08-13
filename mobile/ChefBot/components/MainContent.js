import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/AppStyles';

export const MainContent = ({ onStartCooking, onOpenProfile, isAuthenticated, user }) => {
  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Why Chef Bot Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Why Chef Bot</Text>
        <Text style={styles.sectionDescription}>
          You already have ingredients at home. Chef Bot helps you turn them into dinner—fast.
        </Text>
        <Text style={styles.sectionSubtext}>
          Point your camera, add a preference if you want (vegetarian, 15 minutes, high-protein), and we'll generate clear, step-by-step recipes sized to your time and pantry. No sign-in for the demo, no clutter, just results.
        </Text>

        {/* Feature Cards Row 1 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScrollContainer}>
          <View style={styles.featureCard}>
            <Text style={styles.cardIcon}>⚡</Text>
            <Text style={styles.cardTitle}>Instant ideas</Text>
            <Text style={styles.cardDescription}>
              One photo in, 3–5 recipes out. Get ingredient lists, substitutions, and clear steps with realistic timing.
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.cardIcon}>🎯</Text>
            <Text style={styles.cardTitle}>Smart preferences</Text>
            <Text style={styles.cardDescription}>
              Add notes like "vegetarian", "15 min", or "high protein". Chef Bot adapts servings, methods, and flavors automatically.
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.cardIcon}>🔒</Text>
            <Text style={styles.cardTitle}>Private & light</Text>
            <Text style={styles.cardDescription}>
              No sign-up for the demo. Your image is used only to analyze and suggest recipes. It's fast and built for your phone.
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* How it works Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>How it works</Text>
        
        {/* How-to Cards Row 2 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScrollContainer}>
          <View style={styles.howToCard}>
            <Text style={styles.stepNumber}>1)</Text>
            <Text style={styles.cardTitle}>Snap your fridge</Text>
            <Text style={styles.cardDescription}>
              Take a clear photo of your fridge or ingredients. The better the lighting, the more accurate the suggestions.
            </Text>
          </View>
          
          <View style={styles.howToCard}>
            <Text style={styles.stepNumber}>2)</Text>
            <Text style={styles.cardTitle}>Tell us your vibe</Text>
            <Text style={styles.cardDescription}>
              Optional: diet, time, cuisine. Add quick notes like "spicy", "gluten-free", or "15 minutes" to tailor results.
            </Text>
          </View>
          
          <View style={styles.howToCard}>
            <Text style={styles.stepNumber}>3)</Text>
            <Text style={styles.cardTitle}>Cook in minutes</Text>
            <Text style={styles.cardDescription}>
              Receive concise recipes with ingredients, substitutions, and step-by-step instructions—ready to cook now.
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={onStartCooking}
        >
          <Text style={styles.primaryButtonText}>Start Cooking</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={onOpenProfile}
        >
          <Text style={styles.secondaryButtonText}>
            {isAuthenticated ? user?.email?.split('@')[0] || 'Profile' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
