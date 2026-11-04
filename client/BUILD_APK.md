# Building Android APK for GeoAttend

## Prerequisites
- Android Studio installed
- JAVA_HOME set to Android Studio's JBR: `C:\Program Files\Android\Android Studio\jbr`
- Capacitor CLI installed (`npm install @capacitor/cli @capacitor/core`)

## Build Steps

### 1. Build the web app
```powershell
cd client
npm run build
```

### 2. Sync with Capacitor
```powershell
npx cap sync android
```

This copies the web build to the Android project and updates plugins.

### 3. Build the APK
```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
cd android
.\gradlew assembleDebug
```

### 4. Install on device
The APK will be at: `client/android/app/build/outputs/apk/debug/app-debug.apk`

Transfer to your phone and install, or use:
```powershell
.\gradlew installDebug
```

## Important Notes

### Environment Configuration
- The APK uses `.env.production` settings
- `VITE_API_URL=https://geoattend-b150.onrender.com/api` (points to production server)
- **Do NOT set `server.url` in `capacitor.config.ts`** - this causes a black screen

### Google OAuth on Mobile
- Uses deep linking with custom URL scheme: `geoattend://auth`
- When user signs in with Google:
  1. Opens in-app browser
  2. User authenticates with Google
  3. Server detects mobile request (via `?mobile=true` parameter)
  4. Server redirects to `geoattend://auth/callback?token=xxx`
  5. Android deep link automatically closes browser and opens app
  6. App's deep link listener catches the URL and sets token cookie
  7. App redirects to `/attend` with user logged in

### Location Permissions
- Location permissions are configured in `AndroidManifest.xml`
- Uses `@capacitor/geolocation` plugin for GPS access
- App will request permission on first location access

## Troubleshooting

### Black screen on app launch
- Make sure `server.url` is NOT set in `capacitor.config.ts`
- Rebuild with `npm run build` and `npx cap sync android`

### OAuth browser doesn't close
- Deep linking is configured with `geoattend://auth` custom URL scheme
- Check `AndroidManifest.xml` has the intent-filter: `<data android:scheme="geoattend" android:host="auth" />`
- Server adds `?mobile=true` query parameter and redirects to `geoattend://auth/callback?token=xxx`
- App.tsx has a deep link listener that catches the URL and sets the token

### Location permission denied
- Go to Android Settings → Apps → GeoAttend → Permissions
- Enable Location permission
- Make sure device location is turned on
