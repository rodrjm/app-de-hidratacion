# Google Sign-In nativo (Android / iOS)

La app usa **@react-native-google-signin/google-signin**, que requiere una **development build** (no funciona en Expo Go).

## 1. Google Cloud Console – Configuración

### Cliente "Aplicación web" (ya lo tienes)

- Sírve como **webClientId** en la app.
- En tu `.env`: `EXPO_PUBLIC_GOOGLE_CLIENT_ID` = Client ID de este cliente.
- No hace falta configurar URIs de redirección para el flujo nativo.

### Cliente "Android" (obligatorio para Android)

1. En [Google Cloud Console](https://console.cloud.google.com/) → **APIs y servicios** → **Credenciales**.
2. **+ CREAR CREDENCIALES** → **ID de cliente de OAuth**.
3. Tipo de aplicación: **Android**.
4. Nombre: p. ej. `Dosis Vital Android`.
5. **Nombre del paquete:** `com.dosisvital.app` (debe coincidir con `android.package` en `app.json`).
6. **Huella digital del certificado SHA-1:**
   - **Debug (para probar en desarrollo):**  
     Tras hacer `npx expo prebuild`, en la carpeta `android` ejecuta:
     ```bash
     cd android && ./gradlew signingReport
     ```
     (En Windows: `gradlew.bat signingReport`).  
     Copia el **SHA-1** de la variante **debug** (o la que uses).
   - **Release (para producción):**  
     Usa el SHA-1 del keystore con el que firmas la app (o el que te da Google Play si usas Play App Signing).
7. Crear y anotar el **Client ID** si lo necesitas para algo más; para el flujo nativo no se pone en la app (la app usa el Web client ID como `webClientId`).

### Cliente "iOS" (solo si publicas en Apple)

1. Crear credencial **ID de cliente de OAuth** → tipo **iOS**.
2. Nombre: p. ej. `Dosis Vital iOS`.
3. **ID del bundle:** el de tu app iOS (Expo lo genera en prebuild; suele derivar del slug/proyecto).
4. Crear y copiar el **Client ID** (formato `xxxxx-yyy.apps.googleusercontent.com`).
5. En `.env` añadir:
   ```bash
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxxx-yyy.apps.googleusercontent.com
   ```
   El plugin de Expo construye solo el **iosUrlScheme** a partir de este valor.

## 2. Variables de entorno (.env)

```bash
# Obligatorio (Web client ID = webClientId en la app)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=tu-web-client-id.apps.googleusercontent.com

# Opcional; solo si construyes para iOS
# EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-ios-client-id.apps.googleusercontent.com
```

## 3. Build y ejecución (no Expo Go)

```bash
# Instalar dependencias si falta
npm install

# Generar carpetas nativas (android/ e ios/)
npx expo prebuild --clean

# Android: obtener SHA-1 debug para el cliente Android en Google Cloud
cd android && ./gradlew signingReport
# Añadir ese SHA-1 en el cliente Android en la consola de Google.

# Ejecutar en dispositivo/emulador (development build)
npx expo run:android
# o para iOS:
# npx expo run:ios
```

No uses **Expo Go** para probar Google Sign-In; solo funciona en development build o en la app de producción.

## Resumen de clientes en Google Cloud

| Tipo          | Uso en la app              | Qué configurar |
|---------------|----------------------------|----------------|
| Aplicación web | `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (webClientId) | Nada más (no URIs) |
| Android       | Flujo nativo Android       | Package `com.dosisvital.app` + SHA-1 (debug y/o release) |
| iOS           | Flujo nativo iOS           | Bundle ID + en .env `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
