import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, Image } from 'react-native';
import { FlatGrid } from 'react-native-super-grid';
import { styles } from '../styles/AppStyles';

export const RecipesPage = ({ recipes, onBack, analysisResult }) => {

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
      case 'easy': return '#2ba84a';   // Chef Bot green
      case 'medium': return '#ffc53a'; // Golden yellow  
      case 'hard': return '#e06d06';   // Orange
      default: return '#2ba84a';       // Default to green
    }
  };

  const getTimeDisplay = (timeMins) => {
    if (!timeMins) return '-- min';
    if (timeMins < 60) return `${timeMins} min`;
    const hours = Math.floor(timeMins / 60);
    const mins = timeMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Recipe Card Component
  const RecipeCard = ({ recipe }) => (
    <View style={{
      backgroundColor: '#1e1e1e',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#333333',
      shadowColor: '#2ba84a',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      minHeight: 200, // Minimum height for consistency
    }}>
      {/* Recipe Image Fallback */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ 
          height: 70, 
          backgroundColor: '#2d2d2d', 
          borderRadius: 8, 
          justifyContent: 'center', 
          alignItems: 'center',
          overflow: 'hidden',
        }}>
          <Image
            source={require('../assets/images/icon-large.svg')}
            style={{ width: 40, height: 40, resizeMode: 'contain', opacity: 0.7 }}
          />
        </View>
      </View>

      {/* Recipe Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 }}>
          {recipe.title || 'Untitled Recipe'}
        </Text>
      
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 16, marginRight: 4 }}>⏱️</Text>
            <Text style={{ fontSize: 14, color: '#b3b3b3' }}>
              {getTimeDisplay(recipe.timeMins)}
            </Text>
          </View>
        
          <View style={{
            backgroundColor: getDifficultyColor(recipe.difficulty),
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            marginBottom: 4
          }}>
            <Text style={{ fontSize: 9, color: '#ffffff', fontWeight: '600' }}>
              {recipe.difficulty || 'Medium'}
            </Text>
          </View>
        </View>

        {/* Ingredients List */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#ffffff', marginBottom: 4 }}>Ingredients:</Text>
          <Text style={{ fontSize: 11, color: '#b3b3b3', lineHeight: 14 }}>
            {recipe.ingredients?.join(', ') || 'No ingredients listed'}
          </Text>
          {recipe.ingredients && recipe.ingredients.length > 8 && (
            <Text style={{ color: '#2ba84a', fontSize: 11, marginTop: 2 }}>View more...</Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      {/* Content with ScrollView for entire content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#b3b3b3', textAlign: 'center', marginBottom: 20 }}>
            Explore delicious recipe options
          </Text>

          {/* Recipes Horizontal Scroll with Dynamic Heights */}
          {recipes && recipes.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 25 }}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              decelerationRate="fast"
              snapToInterval={175} // 160 (card width) + 15 (gap)
              snapToAlignment="start"
            >
              {recipes.map((recipe, index) => (
                <View key={index} style={{ marginRight: 15, width: 160 }}>
                  <RecipeCard recipe={recipe} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, minHeight: 200 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 12 }}>No Recipes Found</Text>
              <Text style={{ fontSize: 14, color: '#b3b3b3', textAlign: 'center', lineHeight: 20 }}>
                The AI couldn't generate recipes from your image. Try taking a clearer photo of your ingredients or make sure the image shows food items.
              </Text>
            </View>
          )}

          {/* Ingredients detected - visually separated */}
          {analysisResult?.ingredients && analysisResult.ingredients.length > 0 && (
            <View style={{ marginTop: 10, marginBottom: 25 }}>
              <View style={{ height: 1, backgroundColor: '#222', marginBottom: 18, marginTop: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 }}>
                Ingredients detected
              </Text>
              {analysisResult.ingredients.map((ingredient, index) => (
                <Text key={index} style={{ 
                  fontSize: 16, 
                  color: '#b3b3b3', 
                  marginBottom: 6,
                  paddingLeft: 0
                }}>
                  • {ingredient}
                </Text>
              ))}
            </View>
          )}

          {/* Report Problem Button */}
          <TouchableOpacity 
            style={{ 
              alignSelf: 'center', 
              marginTop: 10,
              marginBottom: 30
            }}
            onPress={handleReportProblem}
          >
            <Text style={{ color: '#e06d06', fontSize: 16, fontWeight: '500' }}>Report a Problem</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
