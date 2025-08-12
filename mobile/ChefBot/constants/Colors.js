// Chef Bot Dark Theme Colors
export const colors = {
  // Brand colors (keep these as they are)
  primary: '#2ba84a',      // Green (robot head)
  secondary: '#e06d06',    // Orange (hat band)
  accent: '#ffc53a',       // Yellow (bolts)
  
  // Dark theme colors
  background: '#121212',   // Dark background (Material Design dark)
  surface: '#1e1e1e',     // Elevated surfaces (cards, modals)
  surfaceVariant: '#2d2d2d', // Alternative surface color
  
  // Text colors
  text: '#ffffff',         // Primary text (white)
  textSecondary: '#b3b3b3', // Secondary text (light gray)
  textDisabled: '#666666', // Disabled text
  
  // UI colors
  border: '#333333',       // Borders and dividers
  error: '#cf6679',        // Error states
  success: '#2ba84a',      // Success (same as primary)
  warning: '#e06d06',      // Warning (same as secondary)
};

// Common styles for dark theme
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 16,
  },
};
