// Los App IDs de AdMob se leen desde variables de entorno para no commitearlos.
// Si no están definidas, se usan los IDs de prueba de Google.
const appJson = require('./app.json');

const androidAppId =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
  'ca-app-pub-3940256099942544~3347511713';
const iosAppId =
  process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
  'ca-app-pub-3940256099942544~1458002511';

// Google Sign-In nativo: iosUrlScheme es el "reversed" del iOS Client ID.
// Ej.: Client ID 123456-xxx.apps.googleusercontent.com → com.googleusercontent.apps.123456-xxx
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const iosUrlScheme = iosClientId
  ? `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/i, '')}`
  : 'com.googleusercontent.apps.0'; // placeholder para solo Android

const config = {
  ...appJson.expo,
  plugins: [
    ...appJson.expo.plugins.map((plugin) => {
      if (plugin[0] === 'react-native-google-mobile-ads') {
        return [
          'react-native-google-mobile-ads',
          {
            ...plugin[1],
            androidAppId,
            iosAppId,
          },
        ];
      }
      return plugin;
    }),
    [
      '@react-native-google-signin/google-signin',
      { iosUrlScheme },
    ],
  ],
};

module.exports = { expo: config };
