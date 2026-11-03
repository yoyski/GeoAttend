# Building Android APK for GeoAttend

This guide will help you build an Android APK from the GeoAttend web app using Capacitor.

## Prerequisites

1. **Install Android Studio**: Download from [https://developer.android.com/studio](https://developer.android.com/studio)
2. **Install Java JDK 17**: Required for Android builds
3. **Set up environment variables**:
   - `ANDROID_HOME` or `ANDROID_SDK_ROOT` pointing to your Android SDK location
   - Add Android SDK tools to your PATH

## Quick Build Steps

### 1. Build the web app
```bash
cd client
npm run build
```

### 2. Sync to Android
```bash
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Build APK in Android Studio
1. In Android Studio, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for the build to complete
3. Click "locate" in the notification to find your APK
4. The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Build Release APK (for Production)

### 1. Generate a signing key (first time only)
```bash
cd android
keytool -genkey -v -keystore geoattend-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias geoattend
```

Save the password securely!

### 2. Configure signing in Android Studio
1. Go to **Build** → **Generate Signed Bundle / APK**
2. Select **APK**
3. Select your keystore file and enter credentials
4. Choose **release** build variant
5. Click **Finish**

### 3. The release APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Command Line Build (Alternative)

### Debug APK:
```bash
cd android
./gradlew assembleDebug
```

### Release APK:
```bash
cd android
./gradlew assembleRelease
```

## Important Notes

- **API URL**: The app is configured to use `https://geo-attend-pi9y.vercel.app` as the backend
- **Permissions**: The app will automatically request location permissions
- **App Size**: The APK will be approximately 10-15 MB
- **Minimum Android Version**: Android 5.0 (API 21)

## Updating the App

When you make changes to the web app:

1. Build the web app: `npm run build`
2. Sync changes: `npx cap sync android`
3. Rebuild APK in Android Studio

## Troubleshooting

### "Android SDK not found"
Set the `ANDROID_HOME` environment variable:
```bash
# Windows
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"

# Mac/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### "Gradle build failed"
1. Open the project in Android Studio
2. Go to **File** → **Sync Project with Gradle Files**
3. Try building again

### App crashes on startup
Check the API URL in `capacitor.config.ts` matches your deployed backend.

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Publishing to Google Play](https://capacitorjs.com/docs/android/deploying-to-google-play)
