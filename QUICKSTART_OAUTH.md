# Google OAuth - Quick Start

Fast guide to get Google sign-in working in GeoAttend.

## ✅ What's Already Done

The code is implemented and your credentials are configured in `server/.env`.

**Next:** Configure Google Cloud Console (10 minutes)

---

## ⚡ 3-Step Setup

### 1. Configure Google Cloud Console

Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**

Find your OAuth client and add these URLs:

**Authorized JavaScript origins:**
```
http://localhost:5173
http://localhost:5000
```

**Authorized redirect URIs:**
```
http://localhost:5000/api/auth/google/callback
```

Click **SAVE**.

### 2. Configure OAuth Consent Screen

Go to **OAuth consent screen** (left sidebar):

1. **App name**: GeoAttend
2. **Scopes**: Add `userinfo.email` and `userinfo.profile`
3. **Test users**: Add your email address
4. Click **SAVE AND CONTINUE** for each section

### 3. Test It

```bash
# Start the app
npm run dev

# Open browser to:
http://localhost:5173/auth

# Click "Sign in with Google"
```

You should be redirected to Google, then back to GeoAttend logged in!

---

## 🐛 Common Issues

### "redirect_uri_mismatch"
✓ Check URI is exactly: `http://localhost:5000/api/auth/google/callback`  
✓ No trailing slash  
✓ Clicked SAVE

### "Access blocked"
✓ OAuth consent screen configured  
✓ Scopes added: `userinfo.email`, `userinfo.profile`  
✓ Your email added as test user

### "Invalid client"
✓ Client ID/Secret in `.env` match Google Console exactly  
✓ No extra spaces  
✓ Restart server after changes

### Button doesn't work
✓ Server running on port 5000  
✓ Client running on port 5173  
✓ Check browser console for errors

---

## 📚 Full Documentation

For detailed setup instructions, troubleshooting, and production deployment:

👉 **[GOOGLE_OAUTH.md](./GOOGLE_OAUTH.md)**

---

## ✨ What You'll Get

- ✓ "Sign in with Google" button on login/register
- ✓ Automatic account linking
- ✓ Profile picture from Google
- ✓ No email verification needed
- ✓ Secure authentication with httpOnly cookies

---

**Status:** Ready to configure ⚡  
**Time:** ~10 minutes  
**Difficulty:** Easy
