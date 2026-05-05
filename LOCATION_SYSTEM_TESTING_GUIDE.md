# Location System - Testing Guide

## 🧪 Comprehensive Testing Checklist

This guide provides step-by-step testing procedures for the database-driven location system.

---

## 📋 Pre-Testing Setup

### **1. Verify Backend is Running**
```bash
# Check if backend API is accessible
curl https://grub-dash-api.vercel.app/api/user/locations
```

### **2. Ensure You Have Test Data**
- At least 2 states in the database
- At least 3 cities per state
- Some active and some inactive locations
- At least one pending vendor location request

### **3. Test Accounts Needed**
- Regular user account (for user address testing)
- Admin account (for admin panel testing)
- Vendor account with pending location (optional)

---

## 🔍 User Address Component Testing

### **Test Location:** `/profile/address`

### **Test 1: Initial Load**
**Steps:**
1. Navigate to `/profile/address`
2. Wait for page to load

**Expected Results:**
- ✅ Skeleton loaders appear briefly
- ✅ State dropdown populates with available states
- ✅ City dropdown is disabled with text "Select state first"
- ✅ No console errors
- ✅ Existing addresses display (if any)

**Pass/Fail:** ______

---

### **Test 2: State Selection**
**Steps:**
1. Click on state dropdown
2. Select a state (e.g., "Lagos")

**Expected Results:**
- ✅ City dropdown becomes enabled
- ✅ City dropdown populates with cities for selected state
- ✅ City dropdown shows "Select City" placeholder
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 3: State Change (Reset Cities)**
**Steps:**
1. Select a state
2. Select a city
3. Change to a different state

**Expected Results:**
- ✅ City dropdown resets to empty
- ✅ New cities populate for new state
- ✅ Previous city selection is cleared
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 4: Add New Address**
**Steps:**
1. Select a state
2. Select a city
3. Enter street address (e.g., "123 Main Street")
4. Click "Save Location"

**Expected Results:**
- ✅ Button shows loading state ("Loading..." with spinner)
- ✅ Success toast appears: "New location added successfully! 🏡"
- ✅ New address appears in the list
- ✅ Form resets (all fields cleared)
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 5: Validation - Empty Fields**
**Steps:**
1. Leave all fields empty
2. Click "Save Location"

**Expected Results:**
- ✅ Error toast appears: "Please select state, city and enter address"
- ✅ No API call is made
- ✅ Form remains as is

**Pass/Fail:** ______

---

### **Test 6: Validation - Missing State**
**Steps:**
1. Leave state empty
2. Select city (should be disabled)
3. Enter street address
4. Click "Save Location"

**Expected Results:**
- ✅ Error toast appears
- ✅ City dropdown remains disabled
- ✅ No API call is made

**Pass/Fail:** ______

---

### **Test 7: Edit Address**
**Steps:**
1. Click "Edit" button on an existing address
2. Observe form population

**Expected Results:**
- ✅ Page scrolls to top smoothly
- ✅ State dropdown pre-selects correct state
- ✅ City dropdown populates and pre-selects correct city
- ✅ Street address pre-fills
- ✅ "Cancel" button appears
- ✅ Button text changes to "Update Location"
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 8: Update Address**
**Steps:**
1. Edit an address
2. Change the street address
3. Click "Update Location"

**Expected Results:**
- ✅ Button shows loading state
- ✅ Success toast: "Address location updated ✨"
- ✅ Address updates in the list
- ✅ Form resets to "Add" mode
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 9: Cancel Edit**
**Steps:**
1. Click "Edit" on an address
2. Make some changes
3. Click "Cancel"

**Expected Results:**
- ✅ Form resets to empty
- ✅ Button text changes back to "Save Location"
- ✅ "Cancel" button disappears
- ✅ No changes are saved
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 10: Set Default Address**
**Steps:**
1. Have at least 2 addresses
2. Click "Set Default" on a non-default address

**Expected Results:**
- ✅ Button shows "Saving..." state
- ✅ Success toast: "Default address updated"
- ✅ Green "Default" badge moves to selected address
- ✅ Previous default loses badge
- ✅ "Set Default" button disappears from new default
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 11: Delete Address**
**Steps:**
1. Click delete (trash) icon on an address
2. Observe modal

**Expected Results:**
- ✅ Modal appears with backdrop blur
- ✅ Modal shows address details
- ✅ Modal has "Yes, Remove It" and "Cancel" buttons
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 12: Confirm Delete**
**Steps:**
1. Open delete modal
2. Click "Yes, Remove It"

**Expected Results:**
- ✅ Button shows "Removing..." state
- ✅ Success toast: "Address removed successfully"
- ✅ Address disappears from list
- ✅ Modal closes
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 13: Cancel Delete**
**Steps:**
1. Open delete modal
2. Click "Cancel" or backdrop

**Expected Results:**
- ✅ Modal closes
- ✅ Address remains in list
- ✅ No API call is made
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 14: Loading State**
**Steps:**
1. Throttle network to "Slow 3G" in DevTools
2. Reload page

**Expected Results:**
- ✅ Skeleton loaders appear
- ✅ "Loading available locations..." message shows
- ✅ Form is disabled during loading
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 15: Error Handling**
**Steps:**
1. Stop backend server
2. Reload page

**Expected Results:**
- ✅ Error message appears: "Error loading locations. Please refresh."
- ✅ "Retry" button is visible
- ✅ Error toast appears
- ✅ Form shows error state
- ✅ Console shows error (expected)

**Pass/Fail:** ______

---

### **Test 16: Empty Locations**
**Steps:**
1. Ensure backend returns empty locations array
2. Reload page

**Expected Results:**
- ✅ Warning message: "No locations available"
- ✅ Helpful text: "Please contact support for assistance"
- ✅ Form is disabled
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 17: Mobile Responsiveness**
**Steps:**
1. Open DevTools
2. Switch to mobile view (iPhone/Android)
3. Test all functionality

**Expected Results:**
- ✅ Layout adapts to mobile screen
- ✅ Dropdowns are touch-friendly
- ✅ Buttons are easily tappable
- ✅ Modals are properly sized
- ✅ All features work on mobile

**Pass/Fail:** ______

---

## 🔐 Admin Location Management Testing

### **Test Location:** `/admin/locations`

### **Test 18: Admin Access**
**Steps:**
1. Log in as admin
2. Navigate to `/admin/locations`

**Expected Results:**
- ✅ Page loads successfully
- ✅ Backend status check runs
- ✅ Three tabs visible: States, Cities, Pending Requests
- ✅ Badge counts show on tabs
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 19: Backend Status - Available**
**Steps:**
1. Ensure backend is running
2. Load admin locations page

**Expected Results:**
- ✅ Green success message: "Backend endpoints are available!"
- ✅ All tabs are functional
- ✅ Data loads in tables
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 20: Backend Status - Not Implemented**
**Steps:**
1. Ensure backend endpoints return 404
2. Load admin locations page

**Expected Results:**
- ✅ Implementation guide screen appears
- ✅ Shows "Backend Implementation Required" message
- ✅ Lists required endpoints
- ✅ Shows "Check Backend Status" button
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 21: States Tab - View**
**Steps:**
1. Click "States" tab
2. Observe table

**Expected Results:**
- ✅ Table shows all states
- ✅ Columns: Name, Status, Created, Actions
- ✅ Status badges are color-coded (green/red)
- ✅ "Add State" button is visible
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 22: Create State**
**Steps:**
1. Click "Add State" button
2. Enter state name (e.g., "Oyo")
3. Click "Create State"

**Expected Results:**
- ✅ Modal appears
- ✅ Input field is focused
- ✅ Button shows "Creating..." during request
- ✅ Success toast: "State created successfully!"
- ✅ Modal closes
- ✅ New state appears in table
- ✅ Table refreshes
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 23: Create State - Validation**
**Steps:**
1. Click "Add State"
2. Leave name empty
3. Click "Create State"

**Expected Results:**
- ✅ Error toast: "Please enter a state name"
- ✅ Modal remains open
- ✅ No API call is made

**Pass/Fail:** ______

---

### **Test 24: Activate/Deactivate State**
**Steps:**
1. Find an active state
2. Click "Deactivate"
3. Observe changes

**Expected Results:**
- ✅ Success toast: "State deactivated successfully!"
- ✅ Status badge changes to red "Inactive"
- ✅ Button text changes to "Activate"
- ✅ Table refreshes
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 25: Cities Tab - View**
**Steps:**
1. Click "Cities" tab
2. Observe table

**Expected Results:**
- ✅ Table shows all cities
- ✅ Columns: Name, State, Status, Created, Actions
- ✅ State names are displayed correctly
- ✅ "Add City" button is visible
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 26: Create City**
**Steps:**
1. Click "Add City" button
2. Select a state
3. Enter city name (e.g., "Ibadan")
4. Click "Create City"

**Expected Results:**
- ✅ Modal appears
- ✅ State dropdown populates
- ✅ Button shows "Creating..." during request
- ✅ Success toast: "City created successfully!"
- ✅ Modal closes
- ✅ New city appears in table
- ✅ Table refreshes
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 27: Create City - Validation**
**Steps:**
1. Click "Add City"
2. Leave state or city name empty
3. Click "Create City"

**Expected Results:**
- ✅ Error toast: "Please fill in all fields"
- ✅ Modal remains open
- ✅ No API call is made

**Pass/Fail:** ______

---

### **Test 28: Activate/Deactivate City**
**Steps:**
1. Find an active city
2. Click "Deactivate"
3. Observe changes

**Expected Results:**
- ✅ Success toast: "City deactivated successfully!"
- ✅ Status badge changes to red "Inactive"
- ✅ Button text changes to "Activate"
- ✅ Table refreshes
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 29: Pending Requests Tab - View**
**Steps:**
1. Click "Pending Requests" tab
2. Observe table

**Expected Results:**
- ✅ Table shows pending vendor requests
- ✅ Columns: Store Name, Requested State, Requested City, Date, Actions
- ✅ "Resolve" buttons are visible
- ✅ If no requests: Shows "No pending location requests"
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 30: Resolve Vendor Request**
**Steps:**
1. Click "Resolve" on a pending request
2. Observe modal

**Expected Results:**
- ✅ Modal appears with vendor details
- ✅ Shows requested state and city
- ✅ State and city inputs are pre-filled
- ✅ "Create location if it doesn't exist" checkbox is visible
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 31: Approve Vendor**
**Steps:**
1. Open resolve modal
2. Modify state/city if needed
3. Check "Create location" if needed
4. Click "Approve Vendor"

**Expected Results:**
- ✅ Button shows "Approving..." during request
- ✅ Success toast: "Vendor approved successfully!"
- ✅ Modal closes
- ✅ Request disappears from table
- ✅ Badge count decreases
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 32: Cancel Vendor Approval**
**Steps:**
1. Open resolve modal
2. Click "Cancel"

**Expected Results:**
- ✅ Modal closes
- ✅ Request remains in table
- ✅ No API call is made
- ✅ No console errors

**Pass/Fail:** ______

---

## 🌐 Integration Testing

### **Test 33: End-to-End Flow**
**Steps:**
1. Admin creates new state "Oyo"
2. Admin creates new city "Ibadan" under "Oyo"
3. Admin activates both
4. User navigates to address page
5. User selects "Oyo" state
6. User selects "Ibadan" city
7. User saves address

**Expected Results:**
- ✅ All steps complete successfully
- ✅ New location is available to users immediately
- ✅ Address saves with correct state and city
- ✅ No console errors throughout

**Pass/Fail:** ______

---

### **Test 34: Inactive Location Handling**
**Steps:**
1. Admin deactivates a state
2. User reloads address page
3. Check if state appears in dropdown

**Expected Results:**
- ✅ Deactivated state does NOT appear in user dropdown
- ✅ Cities under deactivated state are not visible
- ✅ Existing addresses with that location still display
- ✅ No console errors

**Pass/Fail:** ______

---

## 📱 Cross-Browser Testing

### **Test 35: Chrome**
**Steps:**
1. Test all features in Chrome
2. Check console for errors

**Expected Results:**
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 36: Firefox**
**Steps:**
1. Test all features in Firefox
2. Check console for errors

**Expected Results:**
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 37: Safari**
**Steps:**
1. Test all features in Safari
2. Check console for errors

**Expected Results:**
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 38: Edge**
**Steps:**
1. Test all features in Edge
2. Check console for errors

**Expected Results:**
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No console errors

**Pass/Fail:** ______

---

## 🔒 Security Testing

### **Test 39: Unauthorized Access**
**Steps:**
1. Log out
2. Try to access `/admin/locations` directly

**Expected Results:**
- ✅ Redirected to login page
- ✅ Or shows "Access Denied" message
- ✅ No data is exposed

**Pass/Fail:** ______

---

### **Test 40: Cookie Authentication**
**Steps:**
1. Clear cookies
2. Try to fetch locations

**Expected Results:**
- ✅ 401 Unauthorized response
- ✅ User is redirected to login
- ✅ No data is exposed

**Pass/Fail:** ______

---

## 📊 Performance Testing

### **Test 41: Large Dataset**
**Steps:**
1. Create 10+ states with 20+ cities each
2. Load user address page
3. Measure load time

**Expected Results:**
- ✅ Page loads in < 2 seconds
- ✅ Dropdowns populate smoothly
- ✅ No lag when selecting states
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 42: Network Throttling**
**Steps:**
1. Set network to "Slow 3G"
2. Test all features

**Expected Results:**
- ✅ Loading states appear appropriately
- ✅ Features still work (just slower)
- ✅ No timeouts or errors
- ✅ User gets feedback during waits

**Pass/Fail:** ______

---

## 🐛 Edge Cases

### **Test 43: Duplicate State Names**
**Steps:**
1. Try to create a state that already exists

**Expected Results:**
- ✅ Error toast: "State already exists" (or similar)
- ✅ State is not created
- ✅ No console errors

**Pass/Fail:** ______

---

### **Test 44: Special Characters**
**Steps:**
1. Try to create state with special characters (e.g., "Lagos@#$")

**Expected Results:**
- ✅ Either accepts and saves correctly
- ✅ Or shows validation error
- ✅ No console errors
- ✅ No SQL injection or XSS

**Pass/Fail:** ______

---

### **Test 45: Very Long Names**
**Steps:**
1. Try to create state/city with 100+ character name

**Expected Results:**
- ✅ Either truncates or shows validation error
- ✅ UI doesn't break
- ✅ No console errors

**Pass/Fail:** ______

---

## 📝 Test Summary

### **Overall Results:**

**User Address Component:**
- Tests Passed: _____ / 17
- Tests Failed: _____ / 17
- Pass Rate: _____%

**Admin Location Management:**
- Tests Passed: _____ / 15
- Tests Failed: _____ / 15
- Pass Rate: _____%

**Integration & Other:**
- Tests Passed: _____ / 13
- Tests Failed: _____ / 13
- Pass Rate: _____%

**Total:**
- Tests Passed: _____ / 45
- Tests Failed: _____ / 45
- **Overall Pass Rate: _____%**

---

## 🚨 Critical Issues Found

List any critical issues discovered during testing:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## ⚠️ Non-Critical Issues Found

List any minor issues discovered during testing:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## ✅ Sign-Off

**Tested By:** _______________________________________________  
**Date:** _______________________________________________  
**Environment:** _______________________________________________  
**Backend Version:** _______________________________________________  
**Frontend Version:** _______________________________________________  

**Approved for Production:** ☐ Yes  ☐ No  ☐ With Conditions

**Conditions (if any):**
_______________________________________________
_______________________________________________
_______________________________________________

---

*Testing Guide Version: 1.0*  
*Last Updated: 2026-01-30*
