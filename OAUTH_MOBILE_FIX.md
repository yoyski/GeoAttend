# Google OAuth Mobile Deep Linking Fix

## Problem
When users signed in with Google in the mobile APK, the OAuth flow would:
1. Open Chrome browser
2. Complete authentication
3. Stay in the browser instead of returning to the app

## Root Cause
The `Browser.close()` API from `@capacitor/browser` doesn't work when called from a web page inside the browser. The web page doesn't have permission to close its parent browser window.

## Solution: Deep Linking
Implemented Android deep linking with a custom URL scheme that automatically closes the browser and returns to the app.

### Changes Made

#### 1. Capacitor Configuration (`capacitor.config.ts`)
Added deep link configuration:
```typescript
server: {
  hostname: 'geoattend.app',
  androidScheme: 'https'
}
```

This registers `https://geoattend.app` as a custom URL scheme for the app.

#### 2. Android Manifest (`AndroidManifest.xml`)
Added intent-filter to handle deep links:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="geoattend.app" />
</intent-filter>
```

When Android sees a URL like `https://geoattend.app/auth/callback?token=xxx`, it automatically:
- Closes the browser
- Opens the GeoAttend app
- Passes the URL to the app

#### 3. Server OAuth Callback (`auth.controller.ts`)
Modified to detect mobile requests and redirect to deep link:
```typescript
const isMobileApp = userAgent.includes('Capacitor') || req.query.mobile === 'true';

if (isMobileApp) {
  // Redirect to deep link - Android will intercept and open the app
  return res.redirect(`https://geoattend.app/auth/callback?token=${token}`);
}

// For web, use normal Vercel URL
res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}`);
```

#### 4. Client OAuth Trigger (`AuthPage.tsx`)
Added `?mobile=true` query parameter to OAuth URL for mobile:
```typescript
const googleUrl = `${API_URL}/auth/google${isNative ? '?mobile=true' : ''}`;
```

#### 5. Auth Callback Page (`AuthCallbackPage.tsx`)
- Removed `Browser.close()` call (not needed with deep linking)
- Added `@capacitor/app` import
- Added documentation explaining deep linking flow

#### 6. Dependencies
Installed `@capacitor/app` package for app lifecycle management.

## How It Works Now

### Mobile APK Flow:
1. User clicks "Sign in with Google"
2. App opens in-app browser with `?mobile=true` parameter
3. User authenticates with Google
4. Google redirects to server callback
5. Server detects mobile request and redirects to `https://geoattend.app/auth/callback?token=xxx`
6. **Android intercepts the URL** (deep link)
7. **Browser automatically closes**
8. **App opens** at `/auth/callback` route
9. App sets token cookie and redirects to `/attend`

### Web Flow (unchanged):
1. User clicks "Sign in with Google"
2. Browser redirects to Google OAuth
3. Google redirects to server callback
4. Server redirects to `https://geo-attend-pi9y.vercel.app/auth/callback?token=xxx`
5. Web app sets token cookie and redirects to `/attend`

## Testing
1. Build new APK:
   ```powershell
   cd client
   npm run build
   npx cap sync android
   $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
   cd android
   .\gradlew assembleDebug
   ```

2. Install APK on phone:
   - APK location: `client/android/app/build/outputs/apk/debug/app-debug.apk`

3. Test OAuth:
   - Open app
   - Click "Sign in with Google"
   - Complete authentication
   - Browser should automatically close
   - App should open with user logged in

## Important Notes
- Deep linking requires the intent-filter in AndroidManifest.xml
- The domain `geoattend.app` is used only for deep linking (not a real website)
- Web app continues to use `geo-attend-pi9y.vercel.app` domain
- Server must be deployed with the updated auth controller code
