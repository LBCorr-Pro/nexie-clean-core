// src/lib/default-appearance.ts
import type { AppearanceSettings } from '@/hooks/use-nx-appearance';
import type { BottomBarConfig } from '@/lib/types/menus';

/**
 * @description
 * This object defines the default "Nexie" theme appearance.
 * It serves as the standard look and feel of the application when no custom
 * appearance settings are applied. The values are based on the default CSS
 * variables found in `globals.css` and sensible defaults for new features.
 * This object is now complete and includes all properties from AppearanceSettings.
 */

// Define the default BottomBarConfig with an empty tabs array
const defaultBottomBarConfig: BottomBarConfig = {
  enabledOnDesktop: false,
  desktopPosition: 'bottom',
  enableTabs: false,
  showTitleOnSingleTab: false,
  tabsAlignment: 'start',
  tabsDisplayMode: 'icon_and_text',
  tabs: [],
};


export const defaultAppearance: AppearanceSettings = {
  // --- General Theme ---
  themePreference: 'light',
  customized: false,
  
  // --- Main Colors (from MainColorsTab) ---
  primaryColor: "#2563EB",
  primaryForegroundColor: "#FFFFFF",
  accentColor: "#F1F5F9",
  accentForegroundColor: "#0F172A",
  destructiveColor: "#EF4444",
  destructiveForegroundColor: "#FFFFFF",

  // --- Page Background (from BackgroundTab) ---
  backgroundType: "color",
  backgroundColor: "#F8FAFC",
  backgroundGradientFrom: "#F8FAFC",
  backgroundGradientTo: "#E2E8F0",
  backgroundGradientDirection: "to right",
  backgroundImageUrl: "",
  backgroundEffect: "none",

  // --- Components (from ComponentsTab) ---
  foregroundColor: "#0F172A",
  baseBackgroundColor: "#FFFFFF",
  cardColor: "#FFFFFF",
  cardForegroundColor: "#0F172A",
  popoverColor: "#FFFFFF",
  popoverForegroundColor: "#0F172A",
  secondaryColor: "#F1F5F9",
  secondaryForegroundColor: "#0F172A",
  mutedColor: "#F1F5F9",
  mutedForegroundColor: "#64748B",
  borderColor: "#E2E8F0",
  inputBorderColor: "#E2E8F0", // ShadCN 'input' variable
  inputBackgroundColor: "#FFFFFF",
  ringColor: "#60A5FA", // A blue that matches the primary color
  headerBackgroundColor: "#FFFFFF", // Added for completeness, often same as card/base
  tabsTriggerActiveBackgroundColor: "#FFFFFF", // Added for completeness

  // --- Shape & Style ---
  borderRadiusPreset: 'smooth',
  focusRingStyle: 'default',
  ringWidth: 2,
  buttonHoverEffect: 'none',
  tabsContainerStyle: 'connected-border',
  skeletonBaseColor: '#E2E8F0',
  skeletonHighlightColor: '#F8FAFC',
  skeletonAnimationSpeed: 1.5,

  // --- Layout & Effects (from LayoutEffectsTab) ---
  layoutStyle: "default",
  layoutOpacity: 0.8,
  enablePageTransitions: true,
  pageTransitionType: "fade",
  pageTransitionDurationMs: 300,
  topBarVisible: true,
  sidebarVisible: true,
  bottomBarVisible: true,
  sidebarPosition: 'left',
  topBarMode: 'fixed',
  bottomBarMode: 'fixed',

  // --- Typography (from TypographyTab) ---
  fontFamilyPageTitle: "Inter",
  fontFamilyPageSubtitle: "Inter",
  fontFamilySectionTitle: "Inter",
  fontFamilyBody: "Inter",
  fontSizePageTitle: 24,
  fontSizePageSubtitle: 14,
  fontSizeSectionTitle: 18,
  fontSizeBody: 14,
  fontWeightPageTitle: '600',
  fontWeightPageSubtitle: '400',
  fontWeightSectionTitle: '600',
  fontWeightBody: '400',
  letterSpacingPageTitle: -0.025,
  letterSpacingPageSubtitle: 0,
  letterSpacingSectionTitle: 0,
  letterSpacingBody: 0,
  lineHeightPageTitle: 1.2,
  lineHeightPageSubtitle: 1.5,
  lineHeightSectionTitle: 1.4,
  lineHeightBody: 1.6,

  // --- Identity (from IdentityTab) ---
  appleTouchIconUrl: "",
  pwaIcon192Url: "",
  pwaIcon512Url: "",

  // --- Top Bar (from TopBarTab) ---
  topBarBackgroundType: 'solid',
  topBarStyle: 'flat',
  topBarBackgroundColor1: '#FFFFFF',
  topBarBackgroundColor2: '',
  topBarGradientDirection: 'to right',
  topBarBorderColor1: '#E2E8F0',
  topBarBorderColor2: '#2563EB',
  topBarBorderGradientDirection: 'to right',
  topBarBorderWidth: 1,
  topBarUseBackgroundAsGlassBase: false,
  topBarIconColor: "#0F172A",
  topBarLinkOnBranding: false,
  topBarLinkToHome: true,
  topBarAppNameLinkHref: '/dashboard',
  topBarTriggerType: 'icon',
  topBarTriggerIconName: 'Menu',
  topBarTriggerIconColor: '#0F172A',
  topBarTriggerLogoUrl: '',
  topBarBrandingType: 'text',
  topBarBrandingLogoUrl: 'logoUrl',
  topBarBrandingTextType: "full",
  topBarBrandingTextCustom: "",
  topBarBrandingTextFontFamily: "Inter",
  topBarBrandingTextFontWeight: "600",
  topBarBrandingTextFontSize: 16,
  topBarBrandingTextLetterSpacing: 0,
  topBarBrandingTextEffect: 'none',
  topBarBrandingTextTextColor1: '#0F172A',
  topBarBrandingTextTextColor2: '#2563EB',
  topBarBrandingTextShadowColor: 'rgba(0,0,0,0.4)',
  topBarBrandingTextGlowColor: '#FFFFFF',
  topBarBrandingTextGlowStrength: 4,
  topBarBrandingTextAnimationEntry: 'none',
  topBarBrandingTextAnimationRepeat: 'none',
  topBarTextColor: '#0F172A',

  // --- Left Sidebar (from LeftSidebarTab) ---
  leftSidebarLogoExpandedUrl: 'logoUrl', // Refers to 'logoUrl' from General Settings
  leftSidebarLogoCollapsedUrl: 'logoCollapsedUrl', // Refers to 'logoCollapsedUrl' from General Settings
  leftSidebarLogoSize: 'medium',
  leftSidebarShowAppName: true,
  leftSidebarAppNameType: 'full',
  leftSidebarAppNameCustomText: '',
  leftSidebarAppNameFont: 'Inter',
  leftSidebarAppNameColor: '#0F172A',
  leftSidebarAppNameFontWeight: '600',
  leftSidebarAppNameLetterSpacing: 0,
  leftSidebarAppNameTextEffect: 'none',
  leftSidebarAppNameTextColor1: '#0F172A',
  leftSidebarAppNameTextColor2: '#2563EB',
  leftSidebarAppNameTextShadowColor: 'rgba(0,0,0,0.4)',
  leftSidebarAppNameTextGlowColor: '#FFFFFF',
  leftSidebarAppNameTextGlowStrength: 4,
  leftSidebarAppNameAnimationEntry: 'none',
  leftSidebarAppNameAnimationRepeat: 'none',
  leftSidebarLinkOnAppName: false,
  leftSidebarLinkToHome: true,
  leftSidebarAppNameLinkHref: '/dashboard',
  sidebarStyle: 'flat',
  sidebarBackgroundType: 'solid',
  sidebarBackgroundColor1: '#F8FAFC',
  sidebarBackgroundColor2: '',
  sidebarGradientDirection: 'to bottom',
  sidebarBorderColor1: '#E2E8F0',
  sidebarBorderColor2: '#2563EB',
  sidebarBorderGradientDirection: 'to right',
  sidebarBorderWidth: 1,
  sidebarUseBackgroundAsGlassBase: false,
  sidebarForegroundColor: '#0F172A',
  sidebarItemActiveBackgroundColor: '#2563EB',
  sidebarItemActiveTextColor: '#FFFFFF',
  sidebarPrimaryColor: '#2563EB',
  sidebarPrimaryForegroundColor: '#FFFFFF',

  // --- Bottom Bar (from BottomBarTab) ---
  bottomBarStyle: 'flat',
  bottomBarBackgroundType: 'solid',
  bottomBarBackgroundColor1: '#FFFFFF',
  bottomBarBackgroundColor2: '',
  bottomBarGradientDirection: 'to top',
  bottomBarBorderColor1: '#E2E8F0',
  bottomBarBorderColor2: '#2563EB',
  bottomBarBorderGradientDirection: 'to right',
  bottomBarBorderWidth: 1,
  bottomBarUseBackgroundAsGlassBase: false,
  bottomBarIconColorActive: '#2563EB',
  bottomBarIconColorInactive: '#64748B',
  bottomBarTextColorActive: '#2563EB',
  bottomBarTextColorInactive: '#64748B',
  bottomBarFontFamily: 'Inter',
  bottomBarFontSize: 10,
  bottomBarIconSize: 20,
  bottomBarIconLabelSpacing: 2,
  bottomBarItemsAlignment: 'space-around',
  bottomBarItemVerticalAlign: 'center',
  bottomBarItemsGap: 0,
  bottomBarPaddingVertical: 0,
  // CORRECTION: Ensure bottomBarConfig exists and has a tabs array.
  bottomBarConfig: defaultBottomBarConfig,
};
