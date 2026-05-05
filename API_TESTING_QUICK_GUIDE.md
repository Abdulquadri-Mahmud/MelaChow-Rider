# API Configuration - Quick Testing Guide

## 🚀 Quick Start

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser Console
Visit: `http://localhost:3000/auth/signin`

### 3. Expected Console Output
```
[ApiContext] Initialized with baseUrl: /api
[ApiContext] All API requests will proxy through: /api
[ApiContext] Route namespacing: /user/*, /vendors/*, /admin/*
[Next.js Proxy] Backend URL: https://grub-dash-api.vercel.app
[Next.js Proxy] All /api/* requests will be proxied
```

---

## 🧪 Test Signin Flow

### Step 1: Enter Email
Type any email in the signin form

### Step 2: Submit Form
Click "Sign In" button

### Step 3: Check Console Logs
```
[Signin] Sending request to: /api/user/auth/login
[Signin] Form data: { email: "test@example.com" }
[Signin] Response: { message: "OTP sent", success: true }
```

### Step 4: Check Network Tab
- **Request URL**: `http://localhost:3000/api/user/auth/login`
- **Method**: `POST`
- **Status**: `200 OK`
- **Response Headers**: Look for `Set-Cookie: token=...`

---

## ✅ Success Indicators

### Console Logs
- ✅ `[ApiContext]` logs appear on page load
- ✅ `[Next.js Proxy]` logs appear in terminal
- ✅ `[Signin]` logs appear on form submit
- ✅ No errors in console

### Network Tab
- ✅ Request goes to `/api/user/auth/login` (not full backend URL)
- ✅ Status is `200 OK`
- ✅ Cookie is set in response headers

### UI Behavior
- ✅ Button shows "Signing In..." with spinner during loading
- ✅ Success message appears: "Signin successful! 🎉 Redirecting..."
- ✅ Redirect happens after 1 second delay
- ✅ User is redirected to verify-account page

---

## ❌ Error Testing

### Test Invalid Email
Enter: `invalid@test.com`

**Expected Console**:
```
[Signin] Error: AxiosError {...}
[Signin] Server error: 400 Invalid email format
```

**Expected UI**:
Red error message: "Invalid email." or server's error message

### Test Network Error
1. Disconnect internet
2. Try to sign in

**Expected Console**:
```
[Signin] Error: AxiosError {...}
[Signin] Network error - no response received
```

**Expected UI**:
Red error message: "Network error. Please check your connection."

---

## 🔧 Environment Variables

### Current Setup (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://grub-dash-api.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://grub-dash-frontend-xi.vercel.app
```

### Switch to Local Backend
Uncomment in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

**Restart dev server** after changing `.env.local`

---

## 📱 iOS Safari Testing

### Prerequisites
- Deploy to Vercel
- Add environment variables in Vercel dashboard
- Test on actual iOS device or simulator

### Test Steps
1. Open Safari on iOS
2. Navigate to your deployed URL
3. Sign in with email
4. Check if cookie persists:
   - Navigate to another page
   - Refresh the page
   - Close and reopen Safari
5. Verify authentication state is maintained

### Success Criteria
- ✅ Can sign in successfully
- ✅ Cookie persists across page navigation
- ✅ Cookie persists after page refresh
- ✅ Authentication state maintained

---

## 🐛 Troubleshooting

### Issue: No console logs appear
**Solution**: Make sure you're in development mode
```bash
# Check NODE_ENV
echo $env:NODE_ENV  # Windows PowerShell
# Should be empty or 'development'
```

### Issue: Proxy not working
**Solution**: Restart dev server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue: Environment variables not working
**Solution**: 
1. Check `.env.local` exists in root directory
2. Restart dev server
3. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Issue: Cookie not set
**Solution**: Check axios config has `withCredentials: true`
```javascript
await axios.post(endpoint, formData, {
  withCredentials: true,  // ✅ Must be present
});
```

---

## 📊 What to Look For

### Development Logs (Console)
| Log Prefix | When It Appears | What It Means |
|------------|----------------|---------------|
| `[ApiContext]` | Page load | API context initialized |
| `[Next.js Proxy]` | Server start | Proxy configured |
| `[Signin]` | Form submit | Signin request/response |

### Network Requests
| Endpoint | Method | Expected Status | Cookie Set? |
|----------|--------|----------------|-------------|
| `/api/user/auth/login` | POST | 200 | ✅ Yes |
| `/api/user/auth/profile` | GET | 200 | ❌ No (uses existing) |
| `/api/vendors/auth/login` | POST | 200 | ✅ Yes |

---

## 🎯 Quick Validation Checklist

Before considering the refactoring complete:

- [ ] Dev server starts without errors
- [ ] Console shows `[ApiContext]` logs
- [ ] Console shows `[Next.js Proxy]` logs
- [ ] Signin form submits successfully
- [ ] Console shows `[Signin]` logs
- [ ] Network tab shows request to `/api/user/auth/login`
- [ ] Cookie is set in response headers
- [ ] Success message appears
- [ ] Redirect happens after 1 second
- [ ] Error handling works (test with invalid email)
- [ ] Loading state shows "Signing In..." text

---

## 📝 Notes

- All logs only appear in **development mode**
- Production builds will have **no console logs**
- `.env.local` is **gitignored** - don't commit it
- Remember to add environment variables to **Vercel dashboard**
- Restart dev server after changing `.env.local`

---

**Status**: Ready for testing ✅
