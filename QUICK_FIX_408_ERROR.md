# 🔧 Quick Fix Guide - 408 Timeout Error

## ✅ Status: locationService.js Fixed & Pushed

The 408 timeout error in `locationService.js` has been fixed and pushed to GitHub!

---

## 🚨 Remaining URLs to Fix

There are still **25 hardcoded URLs** in the `src/app/lib` directory that need to be updated to use the API proxy.

---

## 🎯 Quick Fix Using VS Code Find & Replace

### Step 1: Open Find & Replace
- Press `Ctrl + H` (Windows) or `Cmd + H` (Mac)
- Or: Edit → Replace

### Step 2: Configure Search
- **Files to include**: `src/app/lib/**/*.js`
- **Use Regular Expression**: ✅ Enable (click the `.*` icon)

### Step 3: Find & Replace Patterns

#### Pattern 1: Simple String URLs
**Find**:
```
"https://grub-dash-api\.vercel\.app/api/
```

**Replace**:
```
getFullApiUrl("/
```

**Click**: Replace All

---

#### Pattern 2: Template Literal URLs
**Find**:
```
`https://grub-dash-api\.vercel\.app/api/
```

**Replace**:
```
getFullApiUrl(`/
```

**Click**: Replace All

---

#### Pattern 3: Base URL Constants
**Find**:
```
const BASE_URL = "https://grub-dash-api\.vercel\.app/api[^"]*";
```

**Replace**:
```
const BASE_URL = getApiUrl();
```

**Click**: Replace All

---

### Step 4: Add Imports

For each file that was updated, add this import at the top:

**Find** (at the top of each file):
```
import axios from "axios";
```

**Replace**:
```
import axios from "axios";
import { getFullApiUrl, getApiUrl, defaultAxiosConfig } from "./apiConfig";
```

---

## 📝 Manual Alternative (Safer)

If you prefer to do it manually, here are the files and line numbers:

### `src/app/lib/api.js` (22 URLs)
Lines to update: 46, 77, 111, 146, 175, 195, 215, 235, 255, 286, 334, 388, 440, 464, 483, 501, 520

**Add import**:
```javascript
import { getFullApiUrl, apiFetch } from "./apiConfig";
```

**Example changes**:
```javascript
// Line 46 - BEFORE
const res = await fetch("https://grub-dash-api.vercel.app/api/user/auth/profile", {

// Line 46 - AFTER
const res = await apiFetch("/user/auth/profile", {

// Line 77 - BEFORE
"https://grub-dash-api.vercel.app/api/orders/create",

// Line 77 - AFTER
getFullApiUrl("/orders/create"),
```

---

### `src/app/lib/orderService.js` (2 URLs)
Lines: 31, 69

**Add import**:
```javascript
import { getFullApiUrl, defaultAxiosConfig } from "./apiConfig";
```

**Changes**:
```javascript
// Line 31 - BEFORE
"https://grub-dash-api.vercel.app/api/orders/v2/create",

// Line 31 - AFTER
getFullApiUrl("/orders/v2/create"),

// Line 69 - BEFORE
`https://grub-dash-api.vercel.app/api/orders/verify/${reference}`,

// Line 69 - AFTER
getFullApiUrl(`/orders/verify/${reference}`),
```

---

### `src/app/lib/vendorApi.js` (1 URL)
Line: 3

**Add import**:
```javascript
import { getApiUrl } from "./apiConfig";
```

**Change**:
```javascript
// BEFORE
const BASE_URL = "https://grub-dash-api.vercel.app/api";

// AFTER
const BASE_URL = getApiUrl();
```

---

### `src/app/lib/vendorFoodApi.js` (1 URL)
Line: 6

**Add import**:
```javascript
import { getApiUrl } from "./apiConfig";
```

**Change**:
```javascript
// BEFORE
const BASE_URL = "https://grub-dash-api.vercel.app/api/vendors/foods";

// AFTER
const BASE_URL = `${getApiUrl()}/vendors/foods`;
```

---

### `src/app/lib/vendorProfileApi.js` (1 URL)
Line: 4

**Add import**:
```javascript
import { getApiUrl } from "./apiConfig";
```

**Change**:
```javascript
// BEFORE
const BASE_URL = "https://grub-dash-api.vercel.app/api/vendors";

// AFTER
const BASE_URL = `${getApiUrl()}/vendors`;
```

---

## ✅ After Making Changes

### 1. Test Locally
```bash
npm run dev
```

- Open the app
- Try the feature that was giving 408 error
- Check browser console for errors
- Verify API calls work

### 2. Commit Changes
```bash
git add .
git commit -m "fix: Update all API URLs to use proxy (fixes 408 timeout)"
git push origin feature/pwa-integration
```

### 3. Verify on Vercel
- Wait for Vercel deployment
- Test on production
- Check for errors

---

## 🎯 Expected Results

After fixing all URLs:

- ✅ No more 408 timeout errors
- ✅ API requests go through `/api/*` (proxy)
- ✅ Faster response times
- ✅ iOS Safari cookies work correctly
- ✅ PWA sessions persist

---

## 🐛 Troubleshooting

### Still Getting 408 Errors?

1. **Clear browser cache**: Ctrl + Shift + Delete
2. **Hard refresh**: Ctrl + Shift + R
3. **Check Network tab**: Verify URLs are relative (`/api/...`)
4. **Check backend**: Ensure backend is responding

### URLs Not Updating?

1. **Restart dev server**: Stop and run `npm run dev` again
2. **Check imports**: Ensure `apiConfig` is imported
3. **Check syntax**: Ensure no typos in function names

---

## 📊 Progress Tracker

- [x] `locationService.js` - ✅ Fixed & Pushed
- [ ] `api.js` - 22 URLs remaining
- [ ] `orderService.js` - 2 URLs remaining
- [ ] `vendorApi.js` - 1 URL remaining
- [ ] `vendorFoodApi.js` - 1 URL remaining
- [ ] `vendorProfileApi.js` - 1 URL remaining

**Total**: 27 URLs to fix (1 done, 26 remaining)

---

## ⏱️ Estimated Time

- **VS Code Find & Replace**: 5 minutes
- **Manual Updates**: 15-20 minutes
- **Testing**: 5 minutes
- **Total**: 10-30 minutes

---

**Let's fix those 408 errors! 🚀**
