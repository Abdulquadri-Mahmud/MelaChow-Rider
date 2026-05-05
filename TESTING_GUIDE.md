# Vendor Dashboard Authentication Testing Guide

## 🎯 Purpose
This guide walks you through testing the cookie-based authentication migration for the vendor dashboard using the provided test script.

---

## 📋 Prerequisites

1. **Backend Running**: Ensure backend is running on `http://localhost:3001`
2. **Frontend Running**: Ensure frontend is running on `http://localhost:3000`
3. **Test Account**: Email `adeyemicodes@gmail.com` (you'll provide OTP)
4. **Browser**: Chrome or Edge with DevTools

---

## 🚀 How to Run the Test

### Step 1: Open the Application
1. Open your browser
2. Navigate to `http://localhost:3000`
3. Open DevTools (F12 or Right-click → Inspect)
4. Go to the **Console** tab

### Step 2: Load the Test Script
In the DevTools Console, run:

```javascript
// Load the test script
const script = document.createElement('script');
script.src = '/test-vendor-auth.js';
document.head.appendChild(script);
```

**OR** manually copy-paste the entire content of `test-vendor-auth.js` into the console.

### Step 3: Start the Test Suite
Once loaded, run:

```javascript
runVendorAuthTests()
```

### Step 4: Follow the Interactive Prompts

The script will guide you through:

1. **Initial State Check** - Verifies no existing auth cookies
2. **Login Page Navigation** - Redirects to `/vendors/auth/login`
3. **Login Form** - Auto-fills email `adeyemicodes@gmail.com`
4. **OTP Prompt** - You'll be asked to enter the OTP you receive
5. **Cookie Verification** - Checks that `vendorToken` cookie is set
6. **Dashboard Loading** - Navigates to vendor dashboard
7. **API Request Analysis** - Checks for query parameters in requests
8. **Endpoint Testing** - Tests each vendor API endpoint
9. **Navigation Test** - Verifies all dashboard pages load
10. **Logout Test** - Tests logout and cookie cleanup

---

## 📊 What the Test Checks

### ✅ Authentication Flow
- [ ] Login form accepts email
- [ ] OTP verification works
- [ ] Cookie is set after successful login
- [ ] Cookie is HttpOnly (check in DevTools → Application → Cookies)

### ✅ API Calls (No Query IDs)
- [ ] `GET /vendors/get-vendor` - No `?id=` parameter
- [ ] `GET /vendors/get-wallet` - No `?id=` parameter
- [ ] `GET /vendors/orders` - No `?id=` parameter
- [ ] All requests include `credentials: 'include'`

### ✅ Dashboard Functionality
- [ ] Dashboard loads without errors
- [ ] Vendor data displays correctly
- [ ] Navigation to My Foods works
- [ ] Navigation to Orders works
- [ ] Navigation to Transactions works
- [ ] Navigation to Profile works

### ✅ Logout
- [ ] Logout button works
- [ ] Cookie is cleared after logout
- [ ] Redirects to login page

---

## 🔍 Manual Verification Steps

While the script runs, also manually verify:

### 1. Check Cookies (DevTools → Application → Cookies)
```
Name: vendorToken
Value: eyJhbGc... (JWT token)
HttpOnly: ✓ (should be checked)
Secure: ✓ (in production)
SameSite: None (for cross-origin)
```

### 2. Check Network Requests (DevTools → Network)

**Filter by**: `vendors`

**Look for these requests:**
```
✅ GET /api/vendors/get-vendor (NO ?id= parameter)
✅ GET /api/vendors/get-wallet (NO ?id= parameter)
✅ GET /api/vendors/orders (NO ?id= parameter)
```

**Check Request Headers:**
```
Cookie: vendorToken=eyJhbGc...
```

**Check Response:**
```
Status: 200 OK
Body: { success: true, data: {...} }
```

### 3. Check Console for Errors
- No 401 Unauthorized errors
- No "Token missing" errors
- No "Invalid vendor ID" errors

---

## 🐛 Troubleshooting

### Issue: "vendorToken cookie not found"

**Check:**
1. Is the backend running?
2. Did OTP verification succeed?
3. Check DevTools → Application → Cookies
4. Is the cookie domain correct?

**Fix:**
```javascript
// Clear all cookies and retry
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

### Issue: "401 Unauthorized" on API calls

**Check:**
1. Is `withCredentials: true` set in API client?
2. Is cookie being sent with request? (Check Network → Headers)
3. Is cookie expired?

**Fix:**
```javascript
// Check if cookie is being sent
// In Network tab, click on request → Headers → Request Headers
// Should see: Cookie: vendorToken=...
```

### Issue: "Requests still have ?id= parameter"

**Check:**
1. Did you clear browser cache?
2. Is the correct version of the code running?
3. Check the actual API file:

```javascript
// Should be:
const getVendorDetails = async () => {
  return await API.get(`/vendors/get-vendor`); // No ID!
};

// NOT:
const getVendorDetails = async (id) => {
  return await API.get(`/vendors/get-vendor?id=${id}`); // ❌ Wrong!
};
```

### Issue: "Dashboard not loading"

**Check:**
1. Is `useVendorStorage` hook working?
2. Check React DevTools → Components → DashboardLayout
3. Check for `isLoading` state

**Fix:**
```javascript
// In console, check vendor data
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.queryCache.getAll()
```

---

## 📸 Expected Results

### Console Output (Success):
```
🧪 VENDOR DASHBOARD AUTHENTICATION TEST SUITE
============================================================

ℹ️  Test 1: Checking initial authentication state...
✅ PASS - Initial State Check

ℹ️  Test 2: Navigating to vendor login page...
✅ PASS - Login Page Navigation

ℹ️  Test 3: Checking login form...
✅ PASS - Login Form Check

ℹ️  Test 6: Verifying authentication cookie...
✅ PASS - Cookie Verification: vendorToken cookie present

ℹ️  Test 8: Analyzing network requests...
✅ PASS - Query Parameter Check: No query-based IDs found

ℹ️  Test 9: Checking credentials configuration...
✅ PASS - Credentials Configuration

ℹ️  Test 10: Testing specific vendor endpoints...
✅ PASS - Endpoint: Get Vendor Details: Status 200
✅ PASS - Endpoint: Get Wallet: Status 200
✅ PASS - Endpoint: Get Orders: Status 200

============================================================
📊 TEST SUMMARY
============================================================

✅ Passed: 10
❌ Failed: 0
⚠️  Warnings: 0

============================================================
✅ ALL TESTS PASSED
============================================================
```

---

## 📝 Test Report

After running the test, you can export results:

```javascript
// Get test results
const results = window.vendorAuthTestResults;

// Export as JSON
console.log(JSON.stringify(results, null, 2));

// Or copy to clipboard
copy(JSON.stringify(results, null, 2));
```

---

## 🎯 Success Criteria

The migration is successful if:

- [x] ✅ All tests pass (0 failures)
- [x] ✅ No `?id=` parameters in vendor API requests
- [x] ✅ `vendorToken` cookie is set and sent with requests
- [x] ✅ Dashboard loads and displays vendor data
- [x] ✅ All dashboard pages navigate correctly
- [x] ✅ Logout clears cookie and redirects to login

---

## 🚀 Next Steps After Testing

If all tests pass:

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: migrate to cookie-based vendor authentication"
   ```

2. **Deploy to Staging**
   - Test with staging backend
   - Verify HTTPS cookie behavior

3. **Deploy to Production**
   - Monitor for 401 errors
   - Check cookie analytics
   - Verify cross-origin requests work

---

## 📞 Support

If tests fail:

1. Check `FRONTEND_AUTH_MIGRATION_COMPLETE.md` for implementation details
2. Review `test-vendor-auth.js` script for specific test logic
3. Check browser console for detailed error messages
4. Verify backend is running the updated authentication middleware

---

**Created**: 2026-01-24  
**Test Email**: adeyemicodes@gmail.com  
**Estimated Time**: 10-15 minutes
