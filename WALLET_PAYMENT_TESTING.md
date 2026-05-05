# 🧪 Wallet Payment Testing Guide

## Quick Test Scenarios

### ✅ Test 1: Successful Wallet Payment
**Prerequisites**: Wallet balance ≥ Order total

1. Add items to cart
2. Go to checkout (`/checkout`)
3. Verify wallet balance is displayed correctly
4. Select "Pay with Wallet" option
5. Click "Complete Order"
6. **Expected Results**:
   - ✅ Toast: "Order Placed Successfully! 🎉"
   - ✅ Cart cleared
   - ✅ Redirected to `/orders` page
   - ✅ Order shows `paymentStatus: "paid"`
   - ✅ Payment reference starts with `WALLET_`

---

### ❌ Test 2: Insufficient Wallet Balance
**Prerequisites**: Wallet balance < Order total

1. Add items to cart (total > wallet balance)
2. Go to checkout
3. Try to select "Pay with Wallet"
4. **Expected Results**:
   - ✅ Toast: "Insufficient balance for this order"
   - ✅ Wallet option appears disabled/grayed
   - ✅ Cannot select wallet payment method

---

### ❌ Test 3: Wallet Not Found
**Prerequisites**: User has no wallet created

1. Login as user without wallet
2. Add items to cart
3. Go to checkout
4. Try to select wallet payment
5. **Expected Results**:
   - ✅ Toast: "Wallet not found. Please fund your wallet first."
   - ✅ Auto-redirect to `/user/wallet` after 2 seconds
   - ✅ User can fund wallet from that page

---

### ✅ Test 4: Wallet Payment with Discount
**Prerequisites**: Valid discount code + Sufficient wallet balance

1. Add items to cart
2. Go to checkout
3. Enter discount code (e.g., "SAVE20")
4. Click "Apply"
5. Verify discount is applied to total
6. Select "Pay with Wallet"
7. Click "Complete Order"
8. **Expected Results**:
   - ✅ Wallet deducted: (Subtotal + Delivery - Discount)
   - ✅ Order created with discount details
   - ✅ Success toast and redirect

---

### ✅ Test 5: Switch Between Payment Methods
**Prerequisites**: Sufficient wallet balance

1. Go to checkout
2. Select "Pay with Wallet"
3. Verify visual feedback (orange border, radio selected)
4. Switch to "Pay with Card/Transfer"
5. Verify visual feedback changes
6. Switch back to wallet
7. **Expected Results**:
   - ✅ Smooth transitions
   - ✅ Clear visual indication of selected method
   - ✅ No errors in console

---

### ✅ Test 6: Paystack Payment (Baseline)
**Prerequisites**: Any order

1. Add items to cart
2. Go to checkout
3. Select "Pay with Card/Transfer"
4. Click "Complete Order"
5. **Expected Results**:
   - ✅ Redirected to Paystack checkout page
   - ✅ Cart cleared before redirect
   - ✅ Order created with `paymentStatus: "pending"`
   - ✅ Can complete payment on Paystack

---

### ❌ Test 7: No Delivery Address
**Prerequisites**: User has no default address

1. Add items to cart
2. Go to checkout (no address set)
3. **Expected Results**:
   - ✅ Red warning box shown
   - ✅ Button text: "Set Address to Continue"
   - ✅ Clicking button redirects to `/profile/address`
   - ✅ Cannot proceed with payment

---

### ❌ Test 8: Closed Restaurant
**Prerequisites**: Restaurant is closed

1. Add items from closed restaurant
2. Go to checkout
3. Click "Complete Order"
4. **Expected Results**:
   - ✅ Error: "Order cannot be placed. The following restaurants are closed: [Restaurant Name]"
   - ✅ Order not created
   - ✅ Cart not cleared

---

## 🔍 Verification Points

### Backend Logs
Check backend for these events:

**Wallet Payment Success**:
```
✅ Wallet balance checked
✅ Funds deducted from wallet
✅ Order created with paymentStatus: "paid"
✅ Vendors notified
✅ Transaction recorded in wallet history
```

**Wallet Payment Failure**:
```
❌ Insufficient balance detected
❌ Order not created
❌ No funds deducted
❌ Error response sent to frontend
```

---

### Frontend State
Monitor these in React DevTools:

```javascript
// State to check
{
  useWallet: true/false,           // Payment method selected
  walletBalance: 5000,             // Current balance
  finalTotal: 3500,                // Order total
  appliedDiscount: {...},          // Discount details
  loadingInit: false,              // Loading state
  orderError: null                 // Error state
}
```

---

### Network Requests

**Wallet Payment Request**:
```json
POST /api/orders/v2/create
{
  "items": [...],
  "deliveryAddress": {...},
  "vendorDeliveryFees": [...],
  "phone": "0801234567",
  "useWallet": true,              // ← KEY FLAG
  "discountCode": "SAVE20"        // ← Optional
}
```

**Wallet Payment Response**:
```json
{
  "success": true,
  "message": "Order created and paid successfully",
  "order": {
    "orderId": "ORD-ABC123",
    "paymentStatus": "paid",       // ← Instant fulfillment
    "paymentReference": "WALLET_ORD-ABC123",
    "total": 5000
  }
}
```

**Paystack Payment Response**:
```json
{
  "success": true,
  "message": "Order created successfully. Proceed to payment.",
  "authorization_url": "https://checkout.paystack.com/abc123",
  "reference": "PSK_ORD-ABC123_1738742400000",
  "order": {
    "orderId": "ORD-ABC123",
    "paymentStatus": "pending"     // ← Awaiting payment
  }
}
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Wallet Balance Not Updating
**Symptoms**: Balance shows old value after funding

**Fix**: 
- Refresh the page
- Check React Query cache (staleTime: 5min)
- Manually invalidate query:
  ```javascript
  queryClient.invalidateQueries(['userWallet'])
  ```

---

### Issue 2: "Wallet Not Found" Error
**Symptoms**: User has wallet but gets error

**Possible Causes**:
- Cookie not sent with request
- User not authenticated
- Backend wallet endpoint issue

**Debug**:
1. Check Network tab → Request Headers → Cookie
2. Verify `/api/user/my-wallet` returns 200
3. Check backend logs for wallet query

---

### Issue 3: Order Created but Cart Not Cleared
**Symptoms**: Order successful but items still in cart

**Fix**: Check `clearCart()` is called after success:
```javascript
if (response?.paymentStatus === "paid") {
  clearCart();  // ← Should be here
  toast.success("Order Placed Successfully! 🎉");
  router.push("/orders");
}
```

---

### Issue 4: Discount Not Applied
**Symptoms**: Discount code accepted but total unchanged

**Debug**:
1. Check `appliedDiscount` state
2. Verify `finalTotal` calculation:
   ```javascript
   const finalTotal = appliedDiscount 
     ? appliedDiscount.total 
     : (subtotal + deliveryFee);
   ```
3. Check backend response includes discount details

---

## 📊 Test Data

### Sample Discount Codes
```
SAVE10   - 10% off
SAVE20   - 20% off
FLAT500  - ₦500 flat discount
FREESHIP - Free delivery
```

### Sample Wallet Balances
```
₦0       - Empty wallet (test error handling)
₦1,000   - Low balance (test insufficient funds)
₦5,000   - Medium balance (test normal orders)
₦50,000  - High balance (test large orders)
```

### Sample Order Totals
```
₦500     - Small order (1 item)
₦2,500   - Medium order (3-5 items)
₦10,000  - Large order (10+ items)
₦25,000  - Bulk order (multiple restaurants)
```

---

## ✅ Success Criteria

All tests pass when:

- [x] Wallet payment completes instantly (no redirect)
- [x] Paystack payment redirects correctly
- [x] Insufficient balance prevents order
- [x] Wallet balance displays accurately
- [x] Discounts work with both payment methods
- [x] Error messages are clear and helpful
- [x] Cart clears after successful payment
- [x] No console errors during checkout
- [x] Mobile UI is responsive and usable
- [x] Loading states prevent double submission

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Test all scenarios on staging environment
- [ ] Verify backend API is using `/api/orders/v2/create`
- [ ] Check wallet balance updates correctly
- [ ] Test with real Paystack account (not test mode)
- [ ] Verify vendor notifications work
- [ ] Test on multiple devices (iOS, Android, Desktop)
- [ ] Check error logging and monitoring
- [ ] Verify transaction history records correctly
- [ ] Test with high traffic (load testing)
- [ ] Review security (no client-side balance manipulation)

---

**Happy Testing! 🎉**
