# Avatar Setup Instructions

## Overview
The app now supports random cute animal avatars for user profiles. Users are automatically assigned a random avatar when they register, and they can change it from their Account page.

## What's Been Implemented

### Backend
- ✅ `server/src/utils/avatar.ts` - Utility functions for avatar management
- ✅ `server/src/controllers/auth.controller.ts` - Assigns random avatar on registration
- ✅ `server/src/config/passport.ts` - Assigns random avatar for Google OAuth users (if no Google photo)

### Frontend
- ✅ `client/src/components/AvatarPicker.tsx` - Modal dialog for selecting avatars
- ✅ `client/src/pages/AccountPage.tsx` - "Choose avatar" button and integration
- ✅ `client/public/avatar/` - Directory created for avatar images

## What You Need To Do

### Add Avatar Images
Place 20 cute animal avatar images in `client/public/avatar/` with these exact filenames:

1. **fox.png**
2. **bear.png**
3. **cat.png**
4. **rabbit.png**
5. **pig.png**
6. **owl.png**
7. **koala.png**
8. **penguin.png**
9. **lion.png**
10. **monkey.png**
11. **sheep.png**
12. **frog.png**
13. **chick.png**
14. **whale.png**
15. **octopus.png**
16. **panda.png**
17. **hedgehog.png**
18. **robot.png**
19. **dino.png**
20. **chick-hatching.png**

### Image Requirements
- **Format**: PNG (with transparency recommended)
- **Size**: 256x256px or similar square dimensions
- **Style**: Cute, cartoon-style animal faces (matching the style you showed)
- **File size**: Keep under 50KB each for fast loading

## How It Works

### New User Registration
1. User registers with email/password
2. Server automatically assigns a random avatar from the 20 options
3. Avatar URL is stored in user document (e.g., `/avatar/fox.png`)

### Google OAuth
1. User signs in with Google
2. If Google provides a profile photo → use that
3. If no Google photo → assign random avatar from the 20 options

### Changing Avatar
1. User goes to Account page
2. Clicks "Choose avatar" button
3. Modal opens showing all 20 cute animal avatars in a grid
4. User selects one and clicks "Set avatar"
5. Avatar is updated in database and UI refreshes

### Custom Upload
- Users can still upload custom photos via the camera button
- Custom uploads are converted to data URLs (base64)
- The "Remove photo" option clears avatar (shows initials instead)

## Testing

1. **Register a new account** → Should see a random cute animal avatar
2. **Go to Account page** → Click "Choose avatar" → Select a different animal
3. **Upload custom photo** → Should work as before
4. **Remove photo** → Should show initials
5. **Sign in with Google** → Should get Google photo or random avatar

## Avatar URL Format

The avatar URLs stored in the database will be:
- Local avatars: `/avatar/fox.png`, `/avatar/bear.png`, etc.
- Google photos: `https://lh3.googleusercontent.com/...`
- Custom uploads: `data:image/png;base64,...`

The frontend `Avatar` component already handles all three formats correctly.
