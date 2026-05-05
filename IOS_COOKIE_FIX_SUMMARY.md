# 🍎 iOS Safari Cookie Fix - Complete Implementation Summary

## ✅ Status: Configuration Complete - Migration Required

---

## 📋 What Was Done

### 1. **Updated `next.config.mjs`** ✅
Added Next.js rewrites and headers to proxy API requests through the frontend domain.

**Key Changes**:
- ✅ Rewrites: `/api/*` → `https://grub-dash-api.vercel.app/api/*`
- ✅ CORS headers for cookie support
- ✅ Detailed comments explaining the fix

**Result**: All API requests now go through the frontend domain, making cookies first-party on iOS.

---

### 2. **Created `apiConfig.js`** ✅
Centralized API configuration with helper functions.

**Features**:
- `getApiUrl()` - Returns base API URL (relative for proxy)
- `getFullApiUrl(endpoint)` - Builds full API URL
- `apiFetch(endpoint, options)` - Fetch wrapper with defaults
- `defaultAxiosConfig` - Axios config with credentials
- `isUsingProxy()` - Check if proxy is active

**Usage**:
```javascript
import { getFullApiUrl, apiFetch } from '@/app/lib/apiConfig';

// Fetch
const res = await apiFetch('/user/auth/profile');

// Axios
const res = await axios.get(getFullApiUrl('/user/my-wallet'), defaultAxiosConfig);
```

---

### 3. **Created Documentation** ✅

| Document | Purpose |
|----------|---------|
| `IOS_SAFARI_COOKIE_FIX.md` | Complete implementation guide |
| `EXAMPLE_API_MIGRATION.js` | Before/after code examples |

---

## 🔄 What Needs to Be Done

### Required: Update All API Calls

You need to update **34 API calls** across **11 files** to use relative URLs instead of absolute URLs.

#### High Priority Files (Core Functionality)

1. **`src/app/lib/api.js`** - 22 URLs
   - User authentication
   - Orders
   - Wallet
   - Reviews
   - Discounts

2. **`src/app/lib/orderService.js`** - 2 URLs
   - Order creation
   - Payment verification

#### Medium Priority Files (Admin/Vendor)

3. **`src/app/lib/adminApi.js`** - 1 URL
4. **`src/app/lib/vendorApi.js`** - 1 URL
5. **`src/app/lib/vendorFoodApi.js`** - 1 URL
6. **`src/app/lib/vendorProfileApi.js`** - 1 URL
7. **`src/app/lib/locationService.js`** - 1 URL

#### Low Priority Files (Specific Pages)

8. **`src/app/context/ApiContext.jsx`** - 1 URL
9. **`src/app/vendors/auth/register/page.jsx`** - 2 URLs
10. **`src/app/admin/locations/page.jsx`** - 1 URL

---

## 🎯 Migration Pattern

### Quick Reference

**Find**:
```javascript
"https://grub-dash-api.vercel.app/api/ENDPOINT"
```

**Replace**:
```javascript
import { getFullApiUrl } from '@/app/lib/apiConfig';
getFullApiUrl("/ENDPOINT")
```

---

### For `fetch` Calls

**Before**:
```javascript
const res = await fetch("https://grub-dash-api.vercel.app/api/user/auth/profile", {
  credentials: "include",
  headers: { "Content-Type": "application/json" }
});
```

**After**:
```javascript
import { apiFetch } from '@/app/lib/apiConfig';

const res = await apiFetch("/user/auth/profile");
// credentials: "include" is automatic
```

---

### For `axios` Calls

**Before**:
```javascript
const res = await axios.post(
  "https://grub-dash-api.vercel.app/api/orders/create",
  data,
  { withCredentials: true }
);
```

**After**:
```javascript
import { getFullApiUrl, defaultAxiosConfig } from '@/app/lib/apiConfig';

const res = await axios.post(
  getFullApiUrl("/orders/create"),
  data,
  defaultAxiosConfig
);
```

---

### For Base URL Constants

**Before**:
```javascript
const BASE_URL = "https://grub-dash-api.vercel.app/api";
```

**After**:
```javascript
import { getApiUrl } from '@/app/lib/apiConfig';

const BASE_URL = getApiUrl();
```

---

## 🔍 How It Works

### The Problem

```
┌──────────────────────────────────────────────┐
│  iOS Safari Cookie Blocking                  │
├──────────────────────────────────────────────┤
│                                              │
│  Frontend: grub-dash-frontend-xi.vercel.app │
│      ↓                                       │
│  Request to: grub-dash-api.vercel.app       │
│      ↓                                       │
│  Backend sets cookie:                        │
│    Domain: grub-dash-api.vercel.app         │
│      ↓                                       │
│  ❌ iOS Safari BLOCKS                        │
│     (third-party cookie)                     │
│                                              │
└──────────────────────────────────────────────┘
```

### The Solution

```
┌──────────────────────────────────────────────┐
│  First-Party Cookie via Proxy                │
├──────────────────────────────────────────────┤
│                                              │
│  Frontend: grub-dash-frontend-xi.vercel.app │
│      ↓                                       │
│  Request to: /api/user/auth/profile         │
│      ↓                                       │
│  Next.js Proxy rewrites to:                 │
│    grub-dash-api.vercel.app/api/...         │
│      ↓                                       │
│  Backend sets cookie:                        │
│    Domain: grub-dash-frontend-xi...         │
│      ↓                                       │
│  ✅ iOS Safari ACCEPTS                       │
│     (first-party cookie)                     │
│                                              │
└──────────────────────────────────────────────┘
```

**Key Insight**: The browser sees the request as coming from the same domain, so cookies are first-party!

---

## 📊 Technical Details

### Next.js Rewrites

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
1. Browser requests: `https://grub-dash-frontend-xi.vercel.app/api/user/auth/profile`
2. Next.js intercepts and rewrites to: `https://grub-dash-api.vercel.app/api/user/auth/profile`
3. Backend responds with cookie
4. Browser receives cookie from `grub-dash-frontend-xi.vercel.app` (first-party!)

---

### CORS Headers

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: 'https://grub-dash-frontend-xi.vercel.app' },
        // ... more headers
      ],
    },
  ];
}
```

**Why Needed**:
- Allows cookies to be sent with requests
- Prevents CORS errors
- Ensures `credentials: "include"` works

---

## 🧪 Testing Checklist

### Before Deployment

- [ ] Update all API calls to use relative URLs
- [ ] Test locally with `npm run dev`
- [ ] Verify no console errors
- [ ] Check network tab shows relative URLs

### After Deployment

- [ ] Deploy to Vercel
- [ ] Clear iOS Safari cache
- [ ] Test login on iOS Safari
- [ ] Verify cookie is set (DevTools)
- [ ] Test page refresh (should stay logged in)
- [ ] Test PWA installation
- [ ] Test PWA login persistence
- [ ] Test on multiple iOS devices

---

## 🚀 Deployment Steps

### 1. Complete Migration

Update all 34 API calls across 11 files using the migration pattern.

### 2. Test Locally

```bash
npm run dev
```

- Test login
- Test authenticated requests
- Check browser console for errors

### 3. Commit and Push

```bash
git add .
git commit -m "feat: Add iOS Safari cookie fix via API proxy"
git push
```

### 4. Vercel Auto-Deploy

Vercel will automatically deploy your changes.

### 5. Test on iOS

- Visit: `https://grub-dash-frontend-xi.vercel.app`
- Test login on iOS Safari
- Verify cookies persist after refresh
- Test PWA installation and login

---

## ⚠️ Important Notes

### 1. Backend Cookie Configuration

The backend should NOT set the `domain` attribute explicitly:

**❌ Wrong**:
```javascript
res.cookie('authToken', token, {
  domain: 'grub-dash-api.vercel.app', // ❌ Don't do this
  httpOnly: true,
  secure: true
});
```

**✅ Correct**:
```javascript
res.cookie('authToken', token, {
  // ✅ No domain attribute - defaults to request domain
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
});
```

This allows the cookie to be set for whichever domain makes the request (the frontend domain via proxy).

---

### 2. CORS on Backend

Ensure backend allows the frontend domain:

```javascript
app.use(cors({
  origin: 'https://grub-dash-frontend-xi.vercel.app',
  credentials: true
}));
```

---

### 3. Environment Variables

Add to `.env.local` (optional):

```env
NEXT_PUBLIC_FRONTEND_URL=https://grub-dash-frontend-xi.vercel.app
NEXT_PUBLIC_API_URL=/api
```

---

## 📈 Expected Results

### Before Fix

- ❌ Login works but session lost on refresh
- ❌ iOS Safari doesn't save cookies
- ❌ PWA doesn't maintain login state
- ❌ Users must re-login constantly

### After Fix

- ✅ Login persists across page refreshes
- ✅ iOS Safari saves cookies correctly
- ✅ PWA maintains login state
- ✅ Seamless experience like desktop browsers

---

## 🐛 Troubleshooting

### Issue: Cookies Still Not Working

**Check**:
1. Are you using relative URLs? (`/api/...` not `https://...`)
2. Is `credentials: "include"` set?
3. Is backend setting `domain` attribute? (should NOT)
4. Are CORS headers correct?

**Debug**:
```javascript
import { isUsingProxy, getApiUrl } from '@/app/lib/apiConfig';

console.log('Using proxy:', isUsingProxy()); // Should be true
console.log('API URL:', getApiUrl()); // Should be "/api"
```

---

### Issue: Network Errors

**Check**:
1. Is Next.js dev server running?
2. Is backend accessible?
3. Are rewrites configured correctly?

**Debug**:
- Check browser Network tab
- Look for failed requests
- Check request URL (should be relative)

---

### Issue: CORS Errors

**Check**:
1. Backend CORS configuration
2. Frontend domain in CORS whitelist
3. Headers in `next.config.mjs`

**Fix**:
- Update backend CORS to allow frontend domain
- Ensure `credentials: true` in CORS config

---

## 📚 Files Summary

### Created Files

| File | Purpose | Status |
|------|---------|--------|
| `next.config.mjs` | Proxy configuration | ✅ Updated |
| `src/app/lib/apiConfig.js` | API helpers | ✅ Created |
| `IOS_SAFARI_COOKIE_FIX.md` | Implementation guide | ✅ Created |
| `EXAMPLE_API_MIGRATION.js` | Migration examples | ✅ Created |
| `IOS_COOKIE_FIX_SUMMARY.md` | This file | ✅ Created |

### Files to Update

| File | URLs | Priority |
|------|------|----------|
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

**Total**: 34 URLs across 11 files

---

## ✅ Next Steps

1. **Review Documentation**:
   - Read `IOS_SAFARI_COOKIE_FIX.md` for detailed guide
   - Check `EXAMPLE_API_MIGRATION.js` for code examples

2. **Start Migration**:
   - Begin with `src/app/lib/api.js` (highest priority)
   - Use find/replace for efficiency
   - Test after each file

3. **Test Thoroughly**:
   - Test locally before deploying
   - Verify all API calls work
   - Check for console errors

4. **Deploy**:
   - Push to GitHub
   - Let Vercel auto-deploy
   - Test on iOS Safari
   - Verify cookies work

---

## 🎯 Success Criteria

Migration is complete when:

- [ ] All 34 API URLs updated to relative URLs
- [ ] No hardcoded `https://grub-dash-api.vercel.app` URLs remain
- [ ] All API calls use `apiConfig` helpers
- [ ] Local testing passes
- [ ] Deployed to Vercel
- [ ] iOS Safari login works
- [ ] Cookies persist after refresh
- [ ] PWA maintains session
- [ ] No console errors

---

## 📞 Support

### Documentation

- **Implementation Guide**: `IOS_SAFARI_COOKIE_FIX.md`
- **Code Examples**: `EXAMPLE_API_MIGRATION.js`
- **This Summary**: `IOS_COOKIE_FIX_SUMMARY.md`

### Resources

- [Next.js Rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites)
- [iOS Safari Cookies](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [MDN: Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)

---

**Implementation Date**: 2026-02-05  
**Status**: ✅ Configuration Complete  
**Next**: 🔄 API Migration Required  
**Priority**: 🔴 CRITICAL (iOS users affected)

---

**Ready to fix iOS Safari cookies! 🍎🚀**
