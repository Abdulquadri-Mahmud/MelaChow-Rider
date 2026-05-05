# ðŸ”„ PWA Update Guide - Version 2.1.0

## ðŸ“± What's New in This Update

### Version 2.1.0 (2026-02-05)

This update includes critical fixes and new features for MelaChow PWA:

---

## ðŸŽ iOS Safari Cookie Fix

**Problem Solved**: Authentication cookies now work correctly on iOS Safari and installed PWAs.

**What Changed**:
- âœ… Cookies are now first-party (same domain)
- âœ… Login persists across app restarts
- âœ… No more constant re-login required
- âœ… Sessions maintained in PWA

**Technical Details**:
- Implemented Next.js API proxy
- All API requests now go through frontend domain
- Cookies set as first-party on iOS devices

---

## ðŸ’° Wallet Payment Feature

**New Feature**: Pay for orders using your wallet balance!

**What's New**:
- âœ… Instant order fulfillment with wallet
- âœ… No redirect needed for wallet payments
- âœ… Real-time balance display
- âœ… Smart validation (prevents insufficient balance orders)
- âœ… Works with discount codes

**How to Use**:
1. Fund your wallet from the Wallet page
2. At checkout, select "Pay with Wallet"
3. Complete order instantly (no Paystack redirect)
4. Order confirmed immediately!

---

## ðŸ”§ Technical Improvements

### API Updates
- Updated to unified order creation endpoint (`/api/orders/v2/create`)
- Enhanced error handling with auto-redirects
- Better user guidance for wallet errors

### Performance
- Faster checkout process
- Reduced API calls
- Improved error recovery

---

## ðŸ“² How to Update Your PWA

### For iOS Users

1. **Close the PWA completely**:
   - Swipe up from bottom and swipe away the app

2. **Clear Safari cache** (optional but recommended):
   - Settings â†’ Safari â†’ Clear History and Website Data

3. **Reopen the PWA**:
   - Tap the MelaChow icon on your home screen
   - The app will automatically update

4. **Verify Update**:
   - Try logging in
   - Check if session persists after closing/reopening
   - Test wallet payment feature

---

### For Android Users

1. **Close the PWA**:
   - Swipe away from recent apps

2. **Clear app data** (if needed):
   - Long press app icon â†’ App info â†’ Storage â†’ Clear data

3. **Reopen the PWA**:
   - Tap the MelaChow icon
   - App will update automatically

---

### For Desktop Users

1. **Close all MelaChow tabs/windows**

2. **Clear browser cache**:
   - Chrome: Ctrl+Shift+Delete â†’ Clear cached images and files
   - Edge: Ctrl+Shift+Delete â†’ Cached images and files
   - Safari: Cmd+Option+E

3. **Reopen the app**:
   - Visit: https://grub-dash-frontend-xi.vercel.app
   - Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

---

## ðŸ§ª Testing the Update

### Test iOS Cookie Fix

1. **Login Test**:
   - Login to your account
   - Close the PWA completely
   - Reopen the PWA
   - âœ… You should still be logged in

2. **Session Persistence**:
   - Use the app normally
   - Close and reopen multiple times
   - âœ… Session should persist

---

### Test Wallet Payment

1. **Fund Wallet**:
   - Go to Wallet page
   - Add funds via Paystack
   - Verify balance shows correctly

2. **Make Order**:
   - Add items to cart
   - Go to checkout
   - Select "Pay with Wallet"
   - âœ… Order should complete instantly

3. **Check Balance**:
   - Verify wallet balance decreased
   - Check order appears in "My Orders"
   - âœ… Order should show "Paid" status

---

## âš ï¸ Known Issues & Solutions

### Issue: Still Getting Logged Out on iOS

**Solution**:
1. Completely uninstall the PWA
2. Clear Safari cache
3. Visit the website in Safari
4. Re-install the PWA (Add to Home Screen)
5. Login again

---

### Issue: Wallet Balance Not Showing

**Solution**:
1. Pull down to refresh the page
2. If still not showing, logout and login again
3. Check internet connection

---

### Issue: Update Not Applying

**Solution**:
1. Uninstall the PWA completely
2. Clear browser cache
3. Reinstall from the website
4. The latest version will be installed

---

## ðŸ“Š Version History

| Version | Date | Changes |
|---------|------|---------|
| **2.1.0** | 2026-02-05 | iOS cookie fix + Wallet payments |
| 2.0.0 | Previous | PWA integration |
| 1.0.0 | Initial | First release |

---

## ðŸ” How to Check Your Version

### In the PWA

1. Open the app
2. Go to Profile/Settings
3. Scroll to bottom
4. Look for "App Version"

### In Browser DevTools

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Manifest"
4. Check "version" field
5. Should show: **2.1.0**

---

## ðŸ†˜ Need Help?

### Update Not Working?

1. **Force Update**:
   - Uninstall PWA
   - Clear all browser data
   - Reinstall from website

2. **Still Having Issues?**:
   - Contact support
   - Provide device info (iOS/Android version)
   - Describe the problem

---

## âœ… Update Checklist

After updating, verify:

- [ ] Can login successfully
- [ ] Session persists after closing app
- [ ] Wallet page loads correctly
- [ ] Can see wallet balance
- [ ] Can make orders with wallet
- [ ] Can make orders with Paystack
- [ ] No console errors
- [ ] App feels faster

---

## ðŸŽ¯ Benefits of This Update

### For Users

- âœ… No more constant re-login on iOS
- âœ… Faster checkout with wallet
- âœ… Better error messages
- âœ… Smoother overall experience

### For Business

- âœ… Better iOS user retention
- âœ… Increased wallet usage
- âœ… Reduced support tickets
- âœ… Higher conversion rates

---

## ðŸ“± PWA Update Mechanism

### How PWA Updates Work

1. **Automatic Check**:
   - PWA checks for updates on app launch
   - Compares manifest version

2. **Download**:
   - New version downloaded in background
   - Cached for next launch

3. **Activation**:
   - Update activates on next app restart
   - Old cache cleared

### Force Update Trigger

The manifest version change (`2.1.0`) triggers:
- Service worker update
- Cache invalidation
- New assets download
- Fresh app state

---

## ðŸš€ What's Next?

### Upcoming Features (v2.2.0)

- [ ] Push notifications for orders
- [ ] Offline mode for browsing
- [ ] Saved payment methods
- [ ] Order tracking map
- [ ] Loyalty rewards

Stay tuned for more updates!

---

**Current Version**: 2.1.0  
**Release Date**: 2026-02-05  
**Status**: âœ… Live on Production

**Enjoy the improved MelaChow experience! ðŸŽ‰**

