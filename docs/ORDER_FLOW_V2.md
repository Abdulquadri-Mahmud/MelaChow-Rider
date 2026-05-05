# Order Creation Flow - V2 API Integration

## Overview

This document describes the enhanced order creation flow using the V2 API with server-side validation and price calculation. The V2 API provides improved security, better error handling, and more reliable order processing.

## Architecture

### Key Components

1. **Service Layer** (`src/app/lib/orderService.js`)
   - `createOrderV2()` - Creates orders with enhanced validation
   - `verifyPaymentV2()` - Verifies Paystack payments
   - Cookie-based authentication (no manual token handling)

2. **Utilities** (`src/app/lib/orderTransformers.js`)
   - `transformCartToOrderV2()` - Converts cart to V2 format
   - `validateCartItems()` - Pre-submission validation
   - `calculateOrderTotals()` - Calculate order totals

3. **UI Components**
   - `OrderErrorDisplay` - Contextual error messages
   - `OrderProcessingLoader` - Animated loading states
   - `CartValidator` - Pre-checkout validation

## Flow Diagram

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    USER CHECKOUT FLOW                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

1. User adds items to cart
   â””â”€> Cart stored in localStorage via CartContext

2. User navigates to /checkout
   â””â”€> CheckoutPage loads cart and user data
   â””â”€> Displays order summary grouped by restaurant

3. User clicks "Complete Order"
   â””â”€> Validates delivery address
   â””â”€> Validates cart items (validateCartItems)
   â””â”€> Shows OrderProcessingLoader

4. Transform cart data
   â””â”€> transformCartToOrderV2() converts to V2 format
   â””â”€> Groups items by restaurant
   â””â”€> Calculates delivery fees per vendor

5. Create order (POST /api/orders/v2/create)
   â””â”€> Backend validates stock availability
   â””â”€> Backend validates restaurant hours
   â””â”€> Backend validates choices/variants
   â””â”€> Backend calculates final prices
   â””â”€> Backend initializes Paystack payment

6. Redirect to Paystack
   â””â”€> User completes payment on Paystack
   â””â”€> Paystack redirects to /verify-payment?reference=XXX

7. Verify payment (POST /api/orders/v2/verify/:reference)
   â””â”€> Backend verifies with Paystack
   â””â”€> Backend creates order in database
   â””â”€> Backend returns order details

8. Show success page
   â””â”€> Display order confirmation
   â””â”€> Clear cart
   â””â”€> Redirect to order tracking

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    ERROR HANDLING                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

At each step, errors are caught and displayed:
- Stock validation errors â†’ "Item out of stock"
- Restaurant closed â†’ "Restaurant is currently closed"
- Invalid choices â†’ "Please select required options"
- Payment errors â†’ "Payment verification failed"
```

## API Endpoints

### 1. Create Order V2

**Endpoint:** `POST /api/orders/v2/create`

**Authentication:** Cookie-based (automatic)

**Request Payload:**
```json
{
  "items": [
    {
      "foodId": "64fa1234567890abcdef1234",
      "restaurantId": "64fa1234567890abcdef5678",
      "variant": {
        "name": "1 Portion",
        "price": 3000,
        "image": "https://..."
      },
      "quantity": 2,
      "note": "Extra spicy",
      "metadata": {
        "variantId": "variant123",
        "storeName": "Restaurant A"
      }
    }
  ],
  "vendorDeliveryFees": [
    {
      "restaurantId": "64fa1234567890abcdef5678",
      "deliveryFee": 700
    }
  ],
  "deliveryAddress": {
    "addressLine": "123 Main St, Apt 4B",
    "city": "Lagos",
    "state": "Lagos",
    "phone": "+2348012345678",
    "label": "Home"
  },
  "phone": "+2348012345678"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Order initialized successfully",
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "...",
  "reference": "PSK_1234567890_abcd"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Jollof Rice: Variant \"2 Portions\" is out of stock"
}
```

### 2. Verify Payment V2

**Endpoint:** `POST /api/orders/v2/verify/:reference`

**Authentication:** Cookie-based (automatic)

**Success Response:**
```json
{
  "success": true,
  "message": "Payment verified and order created",
  "order": {
    "_id": "...",
    "orderId": "ORD-A1B2C3D4E5F6",
    "subtotal": 7000,
    "deliveryFee": 700,
    "total": 7700,
    "paymentStatus": "paid",
    "orderStatus": "pending",
    "deliveryAddress": {...},
    "items": [...]
  },
  "paystack": {
    "reference": "PSK_1234567890_abcd",
    "paid_at": "2026-01-26T10:00:00.000Z",
    "amount": 7700
  }
}
```

## Data Transformation

### Cart Item Structure (Frontend)
```javascript
{
  foodId: "64fa...",
  restaurantId: "64fb...",
  variantId: "var123",
  variantName: "1 Portion",
  name: "Jollof Rice",
  price: 3000,
  quantity: 2,
  image: "https://...",
  storeName: "Restaurant A",
  deliveryFee: 700,
  metadata: {...}
}
```

### V2 Order Item Structure (API)
```javascript
{
  foodId: "64fa...",
  restaurantId: "64fb...",
  variant: {
    name: "1 Portion",
    price: 3000,
    image: "https://..."
  },
  quantity: 2,
  note: "Extra spicy",
  metadata: {
    variantId: "var123",
    storeName: "Restaurant A"
  }
}
```

## Error Types and Handling

### 1. Stock Validation Errors
**Message Pattern:** `"[Item Name]: Variant \"[Variant]\" is out of stock"`

**User Action:**
- Remove item from cart
- Reduce quantity
- Select different variant

### 2. Availability Errors
**Message Pattern:** `"[Item Name] is not available"`

**User Action:**
- Remove item
- Try again later

### 3. Restaurant Closed Errors
**Message Pattern:** `"[Restaurant] is currently closed"`

**User Action:**
- Check opening hours
- Try again later

### 4. Choice Validation Errors
**Message Pattern:** `"Invalid choice: [Details]"`

**User Action:**
- Review item customizations
- Ensure required selections are made

### 5. Address Errors
**Message Pattern:** `"Invalid delivery address"`

**User Action:**
- Update delivery address
- Ensure all fields are filled

## Frontend Validation

Before submitting to the API, the frontend validates:

1. **Cart not empty**
2. **Delivery address selected**
3. **All items have required fields:**
   - foodId
   - restaurantId
   - price > 0
   - quantity >= 1

## Security Features

### Cookie-Based Authentication
- No tokens in localStorage
- HTTP-only cookies prevent XSS
- Automatic credential inclusion
- Secure flag in production

### Server-Side Validation
- Backend recalculates all prices
- Backend validates stock availability
- Backend checks restaurant hours
- Backend validates choices/variants

## User Experience Enhancements

### Loading States
1. **Validating items** - Checking cart data
2. **Checking availability** - Verifying restaurant status
3. **Calculating total** - Processing order details
4. **Preparing payment** - Initializing Paystack

### Error Display
- Contextual error messages
- Suggested recovery actions
- Retry functionality
- Navigate to cart for fixes

### Success Feedback
- Order confirmation display
- Order ID and details
- Track order button
- Clear cart automatically

## Testing Scenarios

### Happy Path
1. Add items to cart
2. Navigate to checkout
3. Verify address is set
4. Click "Complete Order"
5. Redirected to Paystack
6. Complete payment
7. Redirected to success page
8. View order details

### Error Scenarios

#### Out of Stock
1. Add item to cart
2. Item goes out of stock
3. Attempt checkout
4. See error: "Item out of stock"
5. Remove item or reduce quantity
6. Retry

#### Restaurant Closed
1. Add items from restaurant
2. Restaurant closes
3. Attempt checkout
4. See error: "Restaurant is closed"
5. Try again during opening hours

#### Payment Failure
1. Complete checkout
2. Fail payment on Paystack
3. Redirected back
4. See error message
5. Retry payment

## Migration from V1

### Key Changes
1. âœ… Use `createOrderV2()` instead of `createOrder()`
2. âœ… Use `verifyPaymentV2()` instead of `verifyPayment()`
3. âœ… Use `transformCartToOrderV2()` for data transformation
4. âœ… No manual token handling (cookies automatic)
5. âœ… Enhanced error handling with `OrderErrorDisplay`
6. âœ… Loading states with `OrderProcessingLoader`

### Backward Compatibility
- Old V1 endpoints still work
- Gradual migration possible
- No breaking changes to cart structure

## Performance Considerations

### Optimizations
- Minimal payload size
- Grouped restaurant calculations
- Single API call for order creation
- Efficient data transformation

### Monitoring
- Track API response times
- Monitor error rates
- Log failed transactions
- Alert on high failure rates

## Support and Troubleshooting

### Common Issues

**Issue:** "Payment verified but order not created"
- **Cause:** Backend order creation failed after payment
- **Solution:** Contact support with reference number

**Issue:** "Failed to initialize payment"
- **Cause:** Network error or backend unavailable
- **Solution:** Retry or check internet connection

**Issue:** Cart validation errors
- **Cause:** Missing required fields in cart items
- **Solution:** Re-add items to cart

### Debug Mode
Enable console logs to see:
- V2 Order Payload
- V2 Order Response
- V2 Payment Verification Response

## Future Enhancements

- [ ] Order scheduling (future delivery time)
- [ ] Multiple payment methods
- [ ] Promo code support
- [ ] Split payment between users
- [ ] Saved payment methods

## Contact

- **Backend API Docs:** `/docs/ORDER_CREATION_V2.md`
- **Frontend Team:** frontend@melachow.com
- **Backend Team:** backend@melachow.com
- **Slack Channel:** #frontend-orders

---

**Last Updated:** 2026-01-26  
**Version:** 2.0  
**Status:** âœ… Production Ready

