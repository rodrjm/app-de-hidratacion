// Los App IDs de AdMob se leen desde variables de entorno para no commitearlos.
// Si no están definidas, se usan los IDs de prueba de Google.
const appJson = require('./app.json');

const androidAppId =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
  'ca-app-pub-3940256099942544~3347511713';
const iosAppId =
  process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
  'ca-app-pub-3940256099942544~1458002511';

const config = {
  ...appJson.expo,
  plugins: appJson.expo.plugins.map((plugin) => {
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
};

module.exports = { expo: config };
