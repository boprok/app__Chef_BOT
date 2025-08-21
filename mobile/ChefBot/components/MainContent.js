import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/AppStyles';
import * as ImagePicker from 'expo-image-picker';
import { recipeAPI } from '../services/api';
import { LimitReachedModal } from './modals/LimitReachedModal';
import { GoProPageModal } from './modals/GoProPageModal';
import { IngredientsPage } from './IngredientsPage';

export const MainContent = ({ isAuthenticated, user, refreshDashboard }) => {
  // Navigation state
  const [currentPage, setCurrentPage] = useState('main'); // 'main' or 'ingredients'
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Handler for Analyze button
  const [analyzing, setAnalyzing] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [goProModalVisible, setGoProModalVisible] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    try {
      const result = await recipeAPI.analyzeImage(selectedImage, preference);
      // Refresh dashboard stats after successful analysis
      if (typeof refreshDashboard === 'function') {
        refreshDashboard();
      }
      
      // Store the analysis result and navigate to ingredients page
      setAnalysisResult(result);
      setCurrentPage('ingredients');
    } catch (error) {
      if (error.message && error.message.includes('429')) {
        if (error.message.includes('Rate limit exceeded')) {
          // Rate limiting error - show specific message
          Alert.alert(
            'Too Many Requests', 
            error.message + '\n\nTip: Upgrade to PRO for higher rate limits!',
            [
              { text: 'OK', style: 'default' },
              { text: 'Upgrade', onPress: () => setGoProModalVisible(true), style: 'default' }
            ]
          );
        } else if (error.message.includes('Free plan limit')) {
          // Monthly limit reached - show upgrade modal
          setLimitModalVisible(true);
        } else {
          // Generic 429 error
          Alert.alert('Limit Reached', error.message || 'Request limit exceeded. Please try again later.');
        }
      } else {
        Alert.alert('Error', error.message || 'Failed to analyze image.');
      }
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Function to open camera and set selected image
  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Camera permission is required to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Do not crop, allow full/original image
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  // Function to open gallery and set selected image
  const openGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Gallery permission is required to select a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Do not crop, allow full/original image
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open gallery.');
    }
  };
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState(null);
  const [preference, setPreference] = useState("");
  const preferenceInputRef = React.useRef(null);

  const handleImagePicker = () => {
    Alert.alert(
      "Select Photo",
      "Choose how you'd like to add your photo",
      [
        {
          text: "Camera",
          onPress: () => openCamera(),
        },
        {
          text: "Gallery",
          onPress: () => openGallery(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  // Ingredients page handlers
  const handleIngredientsChange = (updatedIngredients) => {
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        ingredients: updatedIngredients
      });
    }
  };

  const handleGenerateRecipes = (ingredients) => {
    // For now, just show an alert with the recipes
    if (analysisResult && analysisResult.recipes) {
      const recipeTitles = analysisResult.recipes.map(recipe => recipe.title).join('\n');
      Alert.alert('Generated Recipes', recipeTitles || 'No recipes found');
    }
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
    setAnalysisResult(null);
    setSelectedImage(null);
    setPreference('');
  };

  // Show ingredients page if we have analysis results
  if (currentPage === 'ingredients' && analysisResult) {
    return (
      <IngredientsPage
        ingredients={analysisResult.ingredients || []}
        onIngredientsChange={handleIngredientsChange}
        onGenerateRecipes={handleGenerateRecipes}
        onBack={handleBackToMain}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#181818' }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={40}
      >
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upload Your Photo</Text>
          <Text style={styles.sectionDescription}>
            Take a photo of your ingredients or select one from your gallery to get recipe suggestions
          </Text>
          <TouchableOpacity
            style={[styles.photoUploadBox, { overflow: 'hidden' }]}
            onPress={handleImagePicker}
            activeOpacity={0.7}
          >
            <View style={styles.photoUploadContent}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: '100%', height: '100%', borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Text style={styles.photoUploadIcon}>📸</Text>
                  <Text style={styles.photoUploadTitle}>Add Photo</Text>
                  <Text style={styles.photoUploadSubtitle}>Camera or Gallery</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          {/* Preference Text Box */}
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.photoUploadBox,
              {
                marginTop: 12,
                paddingBottom: 12,
                paddingTop: 16,
                minHeight: 48,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
            onPress={() => preferenceInputRef && preferenceInputRef.current && preferenceInputRef.current.focus()}
          >
            <Text style={[styles.photoUploadTitle, { color: '#fff' }]}>Preferences</Text>
            <TextInput
              ref={preferenceInputRef}
              style={{
                width: '100%',
                minHeight: 40,
                borderRadius: 12,
                borderWidth: 0,
                backgroundColor: 'transparent',
                color: '#fff',
                fontSize: 16,
                marginTop: 4,
                paddingVertical: 2,
                textAlignVertical: 'top',
                textAlign: 'center',
              }}
              placeholder="e.g. No peanuts, vegan, high protein..."
              placeholderTextColor="#bbb"
              value={preference}
              onChangeText={setPreference}
              multiline
              numberOfLines={2}
              underlineColorAndroid="transparent"
            />
          </TouchableOpacity>
          {/* Analyze Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 24, opacity: (!selectedImage || analyzing) ? 0.6 : 1 }]}
            onPress={handleAnalyze}
            activeOpacity={0.8}
            disabled={!selectedImage || analyzing}
          >
            <Text style={styles.primaryButtonText}>
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
      {/* Modals */}
      <LimitReachedModal
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
        onGoPro={() => {
          setLimitModalVisible(false);
          setTimeout(() => setGoProModalVisible(true), 300);
        }}
      />
      <GoProPageModal
        visible={goProModalVisible}
        onClose={() => setGoProModalVisible(false)}
      />
    </View>
  );
}
