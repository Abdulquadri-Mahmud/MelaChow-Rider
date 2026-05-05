# 🍎 iOS Safari Cookie Fix - Implementation Guide

## 📋 Overview

This guide explains how to fix the iOS Safari cookie blocking issue by implementing a first-party API proxy using Next.js rewrites.

---

## 🔴 The Problem

### Why Cookies Are Blocked on iOS

iOS Safari (and iOS PWAs) block **third-party cookies** by default for privacy protection.

**Your Current Setup**:
- Frontend: `https://grub-dash-frontend-xi.vercel.app`
- Backend: `https://grub-dash-api.vercel.app`

When the backend sets a cookie:
```http
Set-Cookie: authToken=abc123; Domain=grub-dash-api.vercel.app
```

iOS Safari sees this as a **third-party cookie** because:
- The cookie domain (`grub-dash-api.vercel.app`) ≠ Current page domain (`grub-dash-frontend-xi.vercel.app`)

**Result**: 🚫 Cookie is **BLOCKED** and dropped

---

## ✅ The Solution

### First-Party API Proxy

Make all API requests go through the **frontend domain** using Next.js rewrites.

**How It Works**:

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE (Third-Party Cookies - BLOCKED on iOS)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (grub-dash-frontend-xi.vercel.app)               │
│      ↓                                                      │
│      │ fetch('https://grub-dash-api.vercel.app/api/...')  │
│      ↓                                                      │
│  Backend (grub-dash-api.vercel.app)                        │
│      ↓                                                      │
│  Set-Cookie: authToken=...; Domain=grub-dash-api...        │
│      ↓                                                      │
│  ❌ iOS Safari BLOCKS (third-party cookie)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AFTER (First-Party Cookies - WORKS on iOS)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (grub-dash-frontend-xi.vercel.app)               │
│      ↓                                                      │
│      │ fetch('/api/...')  ← Relative URL                   │
│      ↓                                                      │
│  Next.js Proxy (grub-dash-frontend-xi.vercel.app)         │
│      ↓                                                      │
│      │ Rewrites to: https://grub-dash-api.vercel.app/api/ │
│      ↓                                                      │
│  Backend (grub-dash-api.vercel.app)                        │
│      ↓                                                      │
│  Set-Cookie: authToken=...; Domain=grub-dash-frontend...   │
│      ↓                                                      │
│  ✅ iOS Safari ACCEPTS (first-party cookie)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight**: The cookie appears to come from the **same domain** as the frontend, so iOS Safari treats it as first-party!

---

## 🔧 Implementation Steps

### Step 1: Update `next.config.mjs` ✅ DONE

The configuration has been updated with:

1. **Rewrites**: Proxy `/api/*` to backend
2. **Headers**: CORS headers for cookie support

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'https://grub-dash-api.vercel.app/api/:path*',
    },
  ];
}
```

**What This Does**:
- Request to `/api/user/auth/profile` → Proxied to `https://grub-dash-api.vercel.app/api/user/auth/profile`
- Browser sees request as same-domain
- Cookies are set as first-party

---

### Step 2: Create API Configuration Helper ✅ DONE

Created `src/app/lib/apiConfig.js` with helper functions:

```javascript
import { getFullApiUrl, apiFetch } from '@/app/lib/apiConfig';

// Get API URL
const url = getFullApiUrl('/user/auth/profile');
// Returns: "/api/user/auth/profile" (uses proxy)

// Or use helper
const response = await apiFetch('/user/auth/profile');
```

---

### Step 3: Update API Calls 🔄 REQUIRED

You need to update all API calls to use **relative URLs** instead of absolute URLs.

#### Example 1: Login Request

**BEFORE** (Absolute URL):
```javascript
const response = await fetch('https://grub-dash-api.vercel.app/api/user/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

**AFTER** (Relative URL):
```javascript
import { apiFetch } from '@/app/lib/apiConfig';

const response = await apiFetch('/user/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

---

#### Example 2: Authenticated Request

**BEFORE**:
```javascript
const res = await fetch('https://grub-dash-api.vercel.app/api/user/auth/profile', {
  credentials: 'include'
});
```

**AFTER**:
```javascript
import { apiFetch } from '@/app/lib/apiConfig';

const res = await apiFetch('/user/auth/profile');
```

---

#### Example 3: Axios Request

**BEFORE**:
```javascript
import axios from 'axios';

const res = await axios.post(
  'https://grub-dash-api.vercel.app/api/orders/v2/create',
  orderData,
  { withCredentials: true }
);
```

**AFTER**:
```javascript
import axios from 'axios';
import { getFullApiUrl, defaultAxiosConfig } from '@/app/lib/apiConfig';

const res = await axios.post(
  getFullApiUrl('/orders/v2/create'),
  orderData,
  defaultAxiosConfig
);
```

---

### Step 4: Update All API Files

Files that need updating (found via grep search):

| File | Occurrences | Priority |
|------|-------------|----------|
| `src/app/lib/api.js` | 22 | 🔴 HIGH |
| `src/app/lib/orderService.js` | 2 | 🔴 HIGH |
| `src/app/lib/adminApi.js` | 1 | 🟡 MEDIUM |
| `src/app/lib/vendorApi.js` | 1 | 🟡 MEDIUM |
| `src/app/lib/vendorFoodApi.js` | 1 | 🟡 MEDIUM |
| `src/app/lib/vendorProfileApi.js` | 1 | 🟡 MEDIUM |
| `src/app/lib/locationService.js` | 1 | 🟡 MEDIUM |
| `src/app/context/ApiContext.jsx` | 1 | 🟢 LOW |
| `src/app/vendors/auth/register/page.jsx` | 2 | 🟢 LOW |
| `src/app/admin/locations/page.jsx` | 1 | 🟢 LOW |

---

## 📝 Migration Pattern

### For `fetch` Calls

**Find**:
```javascript
fetch('https://grub-dash-api.vercel.app/api/ENDPOINT', {
  credentials: 'include',
  // ... other options
})
```

**Replace**:
```javascript
import { apiFetch } from '@/app/lib/apiConfig';

apiFetch('/ENDPOINT', {
  // ... other options (credentials: 'include' is automatic)
})
```

---

### For `axios` Calls

**Find**:
```javascript
axios.METHOD('https://grub-dash-api.vercel.app/api/ENDPOINT', data, {
  withCredentials: true,
  // ... other config
})
```

**Replace**:
```javascript
import { getFullApiUrl, defaultAxiosConfig } from '@/app/lib/apiConfig';

axios.METHOD(getFullApiUrl('/ENDPOINT'), data, {
  ...defaultAxiosConfig,
  // ... other config
})
```

---

### For Base URL Constants

**Find**:
```javascript
const BASE_URL = "https://grub-dash-api.vercel.app/api";
```

**Replace**:
```javascript
import { getApiUrl } from '@/app/lib/apiConfig';

const BASE_URL = getApiUrl();
```

---

## 🧪 Testing

### Test on iOS Safari

1. **Clear Safari Data**:
   - Settings → Safari → Clear History and Website Data

2. **Test Login**:
   ```javascript
   // Should work now
   await apiFetch('/user/auth/login', {
     method: 'POST',
     body: JSON.stringify({ email: 'test@example.com', password: 'password' })
   });
   ```

3. **Verify Cookie**:
   - Open Safari Dev Tools (if available)
   - Check Application → Cookies
   - Should see `authToken` cookie with domain: `grub-dash-frontend-xi.vercel.app`

4. **Test Authenticated Request**:
   ```javascript
   // Should include cookie automatically
   const profile = await apiFetch('/user/auth/profile');
   ```

---

### Test on iOS PWA

1. **Install PWA**:
   - Open app in Safari
   - Tap Share → Add to Home Screen

2. **Open PWA**:
   - Launch from home screen

3. **Test Login**:
   - Should work and persist cookies

4. **Close and Reopen**:
   - Should remain logged in

---

## 🔍 Debugging

### Check if Proxy is Working

```javascript
import { isUsingProxy, getApiUrl } from '@/app/lib/apiConfig';

console.log('Using proxy:', isUsingProxy()); // Should be true
console.log('API URL:', getApiUrl()); // Should be "/api"
```

### Check Network Requests

1. Open browser DevTools
2. Go to Network tab
3. Make an API request
4. Check request URL:
   - ✅ Should be: `https://grub-dash-frontend-xi.vercel.app/api/...`
   - ❌ Should NOT be: `https://grub-dash-api.vercel.app/api/...`

### Check Cookies

1. DevTools → Application → Cookies
2. Look for `authToken` (or your cookie name)
3. Check domain:
   - ✅ Should be: `grub-dash-frontend-xi.vercel.app`
   - ❌ Should NOT be: `grub-dash-api.vercel.app`

---

## ⚠️ Important Notes

### 1. Backend Cookie Settings

The backend should set cookies with these attributes:

```javascript
res.cookie('authToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax', // or 'strict'
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  // ❌ DO NOT set domain explicitly
  // Let it default to the request domain
});
```

**CRITICAL**: Do NOT set `domain` attribute. Let it default to the request domain (which will be the frontend domain due to the proxy).

---

### 2. CORS Headers

The backend should allow credentials from the frontend domain:

```javascript
app.use(cors({
  origin: 'https://grub-dash-frontend-xi.vercel.app',
  credentials: true
}));
```

---

### 3. Development vs Production

**Development** (localhost):
- You can use direct backend URLs if needed
- Or use the proxy (recommended for consistency)

**Production** (Vercel):
- MUST use the proxy (relative URLs)
- This is automatic with `apiConfig.js`

---

## 📊 Migration Checklist

- [x] Update `next.config.mjs` with rewrites
- [x] Create `apiConfig.js` helper
- [ ] Update `src/app/lib/api.js` (22 URLs)
- [ ] Update `src/app/lib/orderService.js` (2 URLs)
- [ ] Update `src/app/lib/adminApi.js` (1 URL)
- [ ] Update `src/app/lib/vendorApi.js` (1 URL)
- [ ] Update `src/app/lib/vendorFoodApi.js` (1 URL)
- [ ] Update `src/app/lib/vendorProfileApi.js` (1 URL)
- [ ] Update `src/app/lib/locationService.js` (1 URL)
- [ ] Update `src/app/context/ApiContext.jsx` (1 URL)
- [ ] Update vendor registration page (2 URLs)
- [ ] Update admin locations page (1 URL)
- [ ] Test on iOS Safari
- [ ] Test on iOS PWA
- [ ] Deploy to Vercel
- [ ] Verify cookies work in production

---

## 🚀 Deployment

### Vercel Deployment

1. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: Add iOS Safari cookie fix via API proxy"
   git push
   ```

2. **Vercel Auto-Deploy**:
   - Vercel will automatically deploy
   - Rewrites will be active immediately

3. **Test on Vercel**:
   - Visit: `https://grub-dash-frontend-xi.vercel.app`
   - Test login on iOS Safari
   - Verify cookies persist

---

## 🎯 Expected Results

### Before Fix
- ❌ Login works but cookies not saved
- ❌ Page refresh logs user out
- ❌ PWA doesn't maintain session
- ❌ iOS Safari shows "not logged in" after refresh

### After Fix
- ✅ Login works and cookies saved
- ✅ Page refresh keeps user logged in
- ✅ PWA maintains session
- ✅ iOS Safari works like desktop browsers

---

## 📚 Additional Resources

- [Next.js Rewrites Documentation](https://nextjs.org/docs/api-reference/next.config.js/rewrites)
- [iOS Safari Cookie Policies](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

---

**Status**: ✅ Configuration Complete - Migration Required  
**Next Step**: Update API calls to use relative URLs  
**Priority**: 🔴 HIGH (Critical for iOS users)
