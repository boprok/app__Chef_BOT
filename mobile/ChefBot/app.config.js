import 'dotenv/config';

export default {
  expo: {
    name: "ChefBot",
    slug: "ChefBot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "chefbot",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.chefbot.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.chefbot.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.170638118979-603d4vah4tus8l00ek53n9iglijsnrst"
        }
      ]
    ],
    extra: {
      googleClientIdAndroid: process.env.GOOGLE_CLIENT_ID_ANDROID,
      googleClientIdIos: process.env.GOOGLE_CLIENT_ID_IOS,
      apiBaseUrl: process.env.API_BASE_URL
    }
  }
};
