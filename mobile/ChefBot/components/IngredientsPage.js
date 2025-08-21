import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/AppStyles';

export const IngredientsPage = ({ ingredients, onIngredientsChange, onGenerateRecipes, onBack }) => {
  const insets = useSafeAreaInsets();
  const [editableIngredients, setEditableIngredients] = useState([...ingredients]);
  const [newIngredient, setNewIngredient] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const removeIngredient = (index) => {
    const updated = editableIngredients.filter((_, i) => i !== index);
    setEditableIngredients(updated);
    if (onIngredientsChange) {
      onIngredientsChange(updated);
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      const updated = [...editableIngredients, newIngredient.trim()];
      setEditableIngredients(updated);
      setNewIngredient('');
      setShowAddInput(false);
      if (onIngredientsChange) {
        onIngredientsChange(updated);
      }
    }
  };

  const handleGenerateRecipes = () => {
    if (editableIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please add at least one ingredient to generate recipes.');
      return;
    }
    if (onGenerateRecipes) {
      onGenerateRecipes(editableIngredients);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingredients Found</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.ingredientsPageContent}>
        <Text style={styles.ingredientsPageTitle}>
          AI found {editableIngredients.length} ingredient{editableIngredients.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.ingredientsPageSubtitle}>
          Review and edit the ingredients before generating recipes
        </Text>

        {/* Ingredients List */}
        <ScrollView style={styles.ingredientsList} showsVerticalScrollIndicator={false}>
          {editableIngredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Text style={styles.ingredientText}>{ingredient}</Text>
              <TouchableOpacity
                style={styles.removeIngredientButton}
                onPress={() => removeIngredient(index)}
              >
                <Text style={styles.removeIngredientText}>−</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Ingredient Input */}
          {showAddInput && (
            <View style={styles.addIngredientContainer}>
              <TextInput
                style={styles.addIngredientInput}
                placeholder="Type ingredient name..."
                placeholderTextColor="#888"
                value={newIngredient}
                onChangeText={setNewIngredient}
                onSubmitEditing={addIngredient}
                autoFocus
              />
              <TouchableOpacity style={styles.addIngredientConfirm} onPress={addIngredient}>
                <Text style={styles.addIngredientConfirmText}>✓</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.ingredientsPageBottomButtons}>
          <TouchableOpacity
            style={styles.addIngredientMainButton}
            onPress={() => setShowAddInput(true)}
          >
            <Text style={styles.addIngredientMainButtonText}>+ Add Ingredient</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.generateRecipesButton}
            onPress={handleGenerateRecipes}
          >
            <Text style={styles.generateRecipesButtonText}>Generate Recipes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
