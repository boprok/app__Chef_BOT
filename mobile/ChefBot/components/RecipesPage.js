import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/AppStyles';

export const RecipesPage = ({ recipes, onBack }) => {
  const insets = useSafeAreaInsets();

  const handleReportProblem = () => {
    const subject = 'Chef Bot - Recipe Issue Report';
    const body = 'Hi, I found an issue with the generated recipes:\n\n';
    const mailtoUrl = `mailto:support@chefbot.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Could not open email app. Please contact support@chefbot.com directly.');
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#2196F3';
    }
  };

  const getTimeDisplay = (timeMins) => {
    if (!timeMins) return '-- min';
    if (timeMins < 60) return `${timeMins} min`;
    const hours = Math.floor(timeMins / 60);
    const mins = timeMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.recipesPageContent}>
        <Text style={styles.recipesPageTitle}>
          {recipes?.length || 0} Recipe{recipes?.length !== 1 ? 's' : ''} Found
        </Text>
        <Text style={styles.recipesPageSubtitle}>
          Swipe to explore delicious options
        </Text>

        {/* Recipes Horizontal Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.recipesScrollView}
          contentContainerStyle={styles.recipesScrollContent}
          decelerationRate="fast"
          snapToInterval={276} // 260 (card width) + 16 (gap)
          snapToAlignment="start"
        >
          {recipes?.map((recipe, index) => (
            <View key={index} style={styles.recipeCard}>
              {/* Recipe Image Placeholder */}
              <View style={styles.recipeImageContainer}>
                <View style={styles.recipeImagePlaceholder}>
                  <Text style={styles.recipeImageText}>🍽️</Text>
                </View>
              </View>

              {/* Recipe Info */}
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle} numberOfLines={2}>
                  {recipe.title || 'Untitled Recipe'}
                </Text>
                
                <View style={styles.recipeMetadata}>
                  <View style={styles.recipeTimeContainer}>
                    <Text style={styles.recipeTimeIcon}>⏱️</Text>
                    <Text style={styles.recipeTimeText}>
                      {getTimeDisplay(recipe.timeMins)}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.recipeDifficultyContainer,
                    { backgroundColor: getDifficultyColor(recipe.difficulty) }
                  ]}>
                    <Text style={styles.recipeDifficultyText}>
                      {recipe.difficulty || 'Medium'}
                    </Text>
                  </View>
                </View>

                {/* Ingredients Preview */}
                <View style={styles.recipeIngredientsPreview}>
                  <Text style={styles.recipeIngredientsTitle}>Ingredients:</Text>
                  <Text style={styles.recipeIngredientsText} numberOfLines={3}>
                    {recipe.ingredients?.join(', ') || 'No ingredients listed'}
                  </Text>
                </View>

                {/* Steps Preview */}
                <View style={styles.recipeStepsPreview}>
                  <Text style={styles.recipeStepsTitle}>Steps:</Text>
                  <Text style={styles.recipeStepsText} numberOfLines={4}>
                    {recipe.steps?.join(' ') || 'No steps available'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Report Problem Button */}
        <TouchableOpacity 
          style={styles.reportProblemButton} 
          onPress={handleReportProblem}
        >
          <Text style={styles.reportProblemText}>📧 Report a Problem</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
