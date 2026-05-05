# V2 Order Creation API - Migration Guide

## Overview

This guide helps you migrate from the V1 order creation API to the enhanced V2 API with server-side validation and improved error handling.

## What's New in V2?

### âœ… Enhanced Features
1. **Server-Side Price Calculation** - Backend recalculates all prices to prevent tampering
2. **Stock Validation** - Real-time inventory checks before order creation
3. **Restaurant Hours Validation** - Ensures restaurants are open
4. **Choice Validation** - Validates required selections and customizations
5. **Better Error Messages** - Contextual, user-friendly error feedback
6. **Cookie-Based Auth** - Improved security with HTTP-only cookies

### ðŸ”„ Breaking Changes
- **None!** V1 endpoints still work, allowing gradual migration

## Migration Steps

### Step 1: Update Service Layer

**Before (V1):**
```javascript
import { createOrder, verifyPayment } from "../lib/api";

const response = await createOrder(token, orderPayload);
const verification = await verifyPayment(reference, body);
```

**After (V2):**
```javascript
import { createOrderV2, verifyPaymentV2 } from "../lib/orderService";

const response = await createOrderV2(orderPayload); // No token needed
const verification = await verifyPaymentV2(reference); // No body needed
```

### Step 2: Transform Cart Data

**Before (V1):**
```javascript
const payload = {
  items: cart.map(item => ({
    foodId: item.foodId,
    variant: {
      name: item.name,
      price: item.price,
      image: item.image,
    },
    price: item.price, // âŒ Frontend price (can be tampered)
    quantity: item.quantity,
    restaurantId: item.restaurantId,
    metadata: item.metadata || {},
    note: notes[item.storeName] || "",
  })),
  deliveryAddress: {...},
  phone: userData.phone,
  subtotal, // âŒ Frontend calculation
  deliveryFee, // âŒ Frontend calculation
  total, // âŒ Frontend calculation
  email: userData.email,
};
```

**After (V2):**
```javascript
import { transformCartToOrderV2 } from "../lib/orderTransformers";

const payload = transformCartToOrderV2(
  cart,
  deliveryAddress,
  userData.phone,
  notes
);

// âœ… Backend calculates subtotal, deliveryFee, and total
// âœ… Backend validates prices against database
// âœ… Cleaner, more secure payload
```

### Step 3: Add Validation

**Before (V1):**
```javascript
if (cart.length === 0) {
  toast.error("Your cart is empty.");
  return;
}

// No other validation
```

**After (V2):**
```javascript
import { validateCartItems } from "../lib/orderTransformers";

// Validate cart before submission
const validation = validateCartItems(cart);

if (!validation.isValid) {
  const errorMessage = validation.errors[0]?.message;
  toast.error(errorMessage);
  return;
}
```

### Step 4: Enhance Error Handling

**Before (V1):**
```javascript
try {
  const res = await createOrder(token, payload);
  // ...
} catch (err) {
  console.error(err);
  toast.error("Payment initialization failed");
}
```

**After (V2):**
```javascript
import OrderErrorDisplay from "../components/Checkout/OrderErrorDisplay";

const [orderError, setOrderError] = useState(null);

try {
  const res = await createOrderV2(payload);
  // ...
} catch (err) {
  const errorMessage = err.message || "Failed to initialize payment";
  setOrderError(errorMessage);
  toast.error(errorMessage, { duration: 4000 });
}

// In JSX:
<OrderErrorDisplay 
  error={orderError}
  onRetry={handleInitializePayment}
  onClose={() => setOrderError(null)}
/>
```

### Step 5: Add Loading States

**Before (V1):**
```javascript
const [loadingInit, setLoadingInit] = useState(false);

// Simple loading state
{loadingInit && <Loader2 className="animate-spin" />}
```

**After (V2):**
```javascript
import OrderProcessingLoader from "../components/Checkout/OrderProcessingLoader";

const [loadingInit, setLoadingInit] = useState(false);
const [processingStep, setProcessingStep] = useState("validating");

// Update step during processing
setProcessingStep("validating");
// ... validation
setProcessingStep("checking");
// ... availability check
setProcessingStep("calculating");
// ... transformation
setProcessingStep("preparing");
// ... API call

// In JSX:
{loadingInit && <OrderProcessingLoader currentStep={processingStep} />}
```

### Step 6: Update Payment Verification

**Before (V1):**
```javascript
import axios from "axios";

const res = await axios.post(
  `${baseUrl}/orders/verify/${reference}`,
  {},
  { headers: { Authorization: `Bearer ${user?.token}` } }
);

if (!res.data.order) {
  // Handle error
}

setOrder(res.data.order);
```

**After (V2):**
```javascript
import { verifyPaymentV2 } from "../lib/orderService";

const res = await verifyPaymentV2(reference);

if (!res.order) {
  // Handle error
}

setOrder(res.order);
```

## Component Updates

### CheckoutPage.jsx

**Key Changes:**
1. Import V2 services and utilities
2. Add error state management
3. Add processing step tracking
4. Use cart validation hook
5. Transform data with `transformCartToOrderV2()`
6. Call `createOrderV2()` instead of `createOrder()`
7. Add error display component
8. Add processing loader component

**Full Example:**
```javascript
"use client";

import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { createOrderV2 } from "../lib/orderService";
import { transformCartToOrderV2, validateCartItems } from "../lib/orderTransformers";
import OrderErrorDisplay from "../components/Checkout/OrderErrorDisplay";
import OrderProcessingLoader from "../components/Checkout/OrderProcessingLoader";
import { useCartValidation } from "../components/Cart/CartValidator";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const [loadingInit, setLoadingInit] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [processingStep, setProcessingStep] = useState("validating");
  
  const { validateCart, validationErrors } = useCartValidation(cart);

  const handleInitializePayment = async () => {
    setOrderError(null);
    
    // Validate cart
    const validation = validateCartItems(cart);
    if (!validation.isValid) {
      setOrderError(validation.errors[0]?.message);
      return;
    }

    setLoadingInit(true);

    try {
      setProcessingStep("calculating");
      const orderPayload = transformCartToOrderV2(
        cart,
        deliveryAddress,
        phone,
        notes
      );

      setProcessingStep("preparing");
      const response = await createOrderV2(orderPayload);

      if (response?.authorization_url) {
        clearCart();
        window.location.href = response.authorization_url;
      }
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setLoadingInit(false);
    }
  };

  return (
    <div>
      <OrderErrorDisplay 
        error={orderError}
        onRetry={handleInitializePayment}
        onClose={() => setOrderError(null)}
      />
      
      {loadingInit && <OrderProcessingLoader currentStep={processingStep} />}
      
      {/* Rest of checkout UI */}
    </div>
  );
}
```

### VerifyPayment.jsx

**Key Changes:**
1. Remove `useUserStorage` and `useApi` hooks
2. Remove token dependency
3. Use `verifyPaymentV2()` instead of axios
4. Update response handling

**Full Example:**
```javascript
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyPaymentV2 } from "../lib/orderService";
import toast from "react-hot-toast";

export default function VerifyPayment() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [order, setOrder] = useState(null);
  const reference = searchParams.get("reference");
  const didVerify = useRef(false);

  useEffect(() => {
    if (!reference || didVerify.current) return;
    didVerify.current = true;

    const verifyPayment = async () => {
      try {
        const res = await verifyPaymentV2(reference);
        
        if (!res.order) {
          setStatus("failed");
          return;
        }

        setOrder(res.order);
        setStatus("success");
        toast.success(res.message);
      } catch (error) {
        setStatus("failed");
        toast.error(error.message);
      }
    };

    verifyPayment();
  }, [reference]);

  // Render based on status
}
```

## Testing Checklist

### Before Deployment

- [ ] Test successful order creation
- [ ] Test payment verification
- [ ] Test out-of-stock error handling
- [ ] Test restaurant closed error
- [ ] Test invalid cart validation
- [ ] Test missing address error
- [ ] Test payment failure scenario
- [ ] Test cart clearing after success
- [ ] Test error retry functionality
- [ ] Test loading states display correctly

### User Acceptance Testing

- [ ] User can add items to cart
- [ ] User can proceed to checkout
- [ ] User sees clear error messages
- [ ] User can retry after errors
- [ ] User is redirected to Paystack
- [ ] User completes payment successfully
- [ ] User sees order confirmation
- [ ] Cart is cleared after order
- [ ] User can track order

## Rollback Plan

If issues arise, you can quickly rollback:

### Option 1: Revert to V1 Endpoints

```javascript
// In orderService.js, change:
"http://localhost:3001/api/orders/v2/create"
// to:
"http://localhost:3001/api/orders/create"

// And:
"http://localhost:3001/api/orders/v2/verify/${reference}"
// to:
"http://localhost:3001/api/orders/verify/${reference}"
```

### Option 2: Use Feature Flag

```javascript
const USE_V2_API = process.env.NEXT_PUBLIC_USE_V2_ORDER_API === "true";

const createOrder = USE_V2_API ? createOrderV2 : createOrderV1;
```

## Performance Comparison

### V1 API
- âŒ Frontend calculates prices (can be tampered)
- âŒ No stock validation
- âŒ Generic error messages
- âš ï¸ Multiple validation checks on backend
- âœ… Fast initial response

### V2 API
- âœ… Backend calculates prices (secure)
- âœ… Real-time stock validation
- âœ… Contextual error messages
- âœ… Single comprehensive validation
- âœ… Optimized for accuracy

## Support

### Getting Help
- **Documentation:** `/docs/ORDER_FLOW_V2.md`
- **Slack:** #frontend-orders
- **Email:** frontend@melachow.com

### Reporting Issues
Include:
1. Error message
2. Console logs
3. Order payload (sanitized)
4. Steps to reproduce

## FAQ

**Q: Do I need to update my cart structure?**  
A: No, the cart structure remains the same. The transformation happens automatically.

**Q: Will V1 orders still work?**  
A: Yes, V1 endpoints remain functional for backward compatibility.

**Q: How do I test V2 locally?**  
A: Ensure your backend is running the V2 endpoints and update the base URL in your API configuration.

**Q: What if a user's payment succeeds but order creation fails?**  
A: V2 API handles this gracefully. The payment is verified first, then the order is created. If order creation fails, the backend will retry or flag for manual review.

**Q: Can I use V2 for some pages and V1 for others?**  
A: Yes, but it's recommended to migrate all order creation flows to V2 for consistency.

---

**Migration Status:** âœ… Complete  
**Last Updated:** 2026-01-26  
**Version:** 2.0

