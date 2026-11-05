# Location Services Detection

## Overview
The app now detects when location services are disabled on the device and prompts users to enable them.

**Status**: ✅ Implemented and built into APK (November 5, 2026)

## Features

### 1. Location Services Detection
- Detects when device location is turned off (error code 2 from Geolocation API)
- Distinguishes between permission denied and services disabled
- Shows clear, actionable error messages

### 2. Error Messages
**Permission Denied (code 1):**
> "Location permission denied. Please allow location access in your settings."

**Services Disabled (code 2):**
> "Location services are turned off. Please enable location services to check in."
> + Button: "Open Location Settings"

**Timeout (code 3):**
> "Location request timed out. Make sure location services are enabled and try again."

### 3. Open Settings Button
When location services are detected as disabled:
- A prominent button appears: "Open Location Settings"
- **On Android**: Opens device location settings directly
- **On Web**: Shows instructions to enable location in browser

## Implementation

### Backend (useLocation.tsx)
```typescript
const [locationServicesDisabled, setLocationServicesDisabled] = useState(false);

const handleError = (e: GeolocationPositionError) => {
  if (e.code === 2) {
    // Position unavailable - location services are off
    setLocationServicesDisabled(true);
    setGpsError('Location services are turned off...');
  }
};

const openLocationSettings = () => {
  if (Capacitor.isNativePlatform()) {
    // Open Android location settings
    App.openSettings();
  } else {
    // Show web instructions
    alert('Please enable location in browser settings');
  }
};
```

### Frontend (AttendPage.tsx)
```typescript
const { locationServicesDisabled, openLocationSettings } = useLocationCtx();

{locationServicesDisabled && (
  <Button onClick={openLocationSettings}>
    Open Location Settings
  </Button>
)}
```

## User Experience

### Scenario 1: Location Services OFF
1. User opens app
2. GPS tries to get location
3. Gets error code 2 (services unavailable)
4. Shows message: "Location services are turned off..."
5. **Button appears: "Open Location Settings"**
6. User taps button → Android location settings open
7. User enables location
8. Returns to app → GPS acquires location automatically

### Scenario 2: Permission Denied
1. User denies location permission
2. Gets error code 1
3. Shows message with instructions
4. No settings button (user needs to grant permission first)

## Technical Details

### Geolocation Error Codes
- **0**: Unknown error
- **1**: Permission denied (user said "no" to permission prompt)
- **2**: Position unavailable (device location is OFF)
- **3**: Timeout (took too long)

### Native Platform Detection
```typescript
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'android', 'ios', 'web'
```

### Opening Settings
Uses `@capacitor/app` plugin:
```typescript
import { App } from '@capacitor/app';
App.openSettings(); // Opens app settings page
```

## Testing

### Test on Android
1. Turn off device location in quick settings
2. Open GeoAttend app
3. Go to Attend tab
4. Verify error message shows
5. Verify "Open Location Settings" button appears
6. Tap button → Should open Android location settings
7. Enable location
8. Return to app → Should acquire GPS

### Test on Web
1. Block location in browser
2. Open app
3. Verify error shows with instructions
4. Re-enable location
5. Refresh page → Should acquire GPS

## Future Enhancements

### Possible Improvements:
1. **Automatic retry**: Retry GPS when user returns to app
2. **Background monitoring**: Detect when services are re-enabled
3. **Better fallback**: If settings can't open, show step-by-step guide
4. **Location accuracy warning**: Alert if accuracy is too low (>50m)

### Advanced Native Features:
```typescript
// Check if location is enabled (requires plugin)
const isEnabled = await LocationAccuracy.canRequest();

// Request to enable location (shows system dialog)
await LocationAccuracy.request(LocationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
```

## Dependencies
- `@capacitor/core` - Platform detection
- `@capacitor/app` - Open settings
- `@capacitor/geolocation` - GPS access (optional, uses web API)

## Notes
- The watchPosition API continuously monitors location
- Error handling is immediate - no need to manually retry
- Settings button only shows when services are detected as OFF
- Works on both native (Android/iOS) and web platforms
