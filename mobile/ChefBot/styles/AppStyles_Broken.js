import { StyleSheet } from 'react-native';
import { colors } from '../constants/Colors';

export const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  goProButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goProButtonText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 14,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    width: 32,
  },
  dashboardButtonIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 12,
  },
  sectionSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 30,
  },
  cardScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  featureCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    marginRight: 16,
    width: 180,
    borderWidth: 1,
    borderColor: colors.border,
  },
  howToCard: {
    backgroundColor: colors.surfaceVariant,
    padding: 24,
    borderRadius: 16,
    marginRight: 16,
    width: 180,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  // Auth Modal Styles
  authModalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  authModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  authModalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  authInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  authButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  authSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authSwitchText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  authSwitchButton: {
    marginLeft: 4,
  },
  authSwitchButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Camera Modal Styles
  cameraModalContainer: {
    width: '95%',
    height: '85%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  libraryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.accent,
  },
  libraryButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },

  // Profile Modal Styles
  profileModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  profileModalContent: {
    width: '80%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  profileModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  profileEmailText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#e06d06',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileCloseButton: {
    paddingVertical: 8,
  },
  profileCloseText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  // Analysis Modal Styles
  analysisModalContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  capturedImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  capturedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  analysisResult: {
    flex: 1,
  },
  analysisText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  analysisCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  analysisCloseText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Dashboard Modal Styles
  dashboardModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dashboardCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dashboardCloseText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  dashboardLogoutButton: {
    backgroundColor: '#e06d06',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardLogoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Go Pro Page styles
  goProPageContainer: {
    width: '95%',
    maxHeight: '90%',
  },
  goProPageContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  goProPageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  goProPageSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  pricingCard: {
    backgroundColor: colors.primary,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 18,
    color: colors.onPrimary,
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  pricingPeriod: {
    fontSize: 16,
    color: colors.onPrimary,
    opacity: 0.8,
  },
  subscribeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  subscribeButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  goProPageCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  goProPageCloseText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 60,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  splashBottom: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '500',
    textAlign: 'center',
  },
});
