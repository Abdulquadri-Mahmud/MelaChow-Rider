# Order Creation V2 - Quick Reference

## 🚀 Quick Start

### Create an Order

```javascript
import { createOrderV2 } from "@/app/lib/orderService";
import { transformCartToOrderV2 } from "@/app/lib/orderTransformers";

const orderPayload = transformCartToOrderV2(
  cartItems,
  deliveryAddress,
  userPhone,
  notes
);

const response = await createOrderV2(orderPayload);

if (response?.authorization_url) {
  window.location.href = response.authorization_url;
}
```

### Verify Payment

```javascript
import { verifyPaymentV2 } from "@/app/lib/orderService";

const result = await verifyPaymentV2(paystackReference);

if (result.success) {
  console.log("Order ID:", result.order.orderId);
  console.log("Total:", result.order.total);
}
```

---

## 📋 Common Patterns

### Complete Checkout Flow

```javascript
"use client";

import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { createOrderV2 } from "@/app/lib/orderService";
import { transformCartToOrderV2, validateCartItems } from "@/app/lib/orderTransformers";
import OrderErrorDisplay from "@/app/components/Checkout/OrderErrorDisplay";
import OrderProcessingLoader from "@/app/components/Checkout/OrderProcessingLoader";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("validating");

  const handleCheckout = async () => {
    setError(null);
    
    // Validate
    const validation = validateCartItems(cart);
    if (!validation.isValid) {
      setError(validation.errors[0]?.message);
      return;
    }

    setLoading(true);

    try {
      setStep("calculating");
      const payload = transformCartToOrderV2(cart, address, phone, notes);

      setStep("preparing");
      const response = await createOrderV2(payload);

      if (response?.authorization_url) {
        clearCart();
        window.location.href = response.authorization_url;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <OrderErrorDisplay error={error} onRetry={handleCheckout} />
      {loading && <OrderProcessingLoader currentStep={step} />}
      <button onClick={handleCheckout}>Complete Order</button>
    </div>
  );
}
```

### Payment Verification

```javascript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyPaymentV2 } from "@/app/lib/orderService";

export default function VerifyPayment() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) return;

    verifyPaymentV2(reference)
      .then(res => {
        setOrder(res.order);
        setStatus("success");
      })
      .catch(err => {
        setStatus("failed");
      });
  }, [searchParams]);

  if (status === "verifying") return <div>Verifying...</div>;
  if (status === "failed") return <div>Payment Failed</div>;
  
  return <div>Order {order.orderId} confirmed!</div>;
}
```

---

## 🛠️ Utility Functions

### Validate Cart

```javascript
import { validateCartItems } from "@/app/lib/orderTransformers";

const validation = validateCartItems(cart);

if (!validation.isValid) {
  validation.errors.forEach(err => {
    console.log(`${err.itemName}: ${err.message}`);
  });
}
```

### Calculate Totals

```javascript
import { calculateOrderTotals } from "@/app/lib/orderTransformers";

const totals = calculateOrderTotals(cart);

console.log("Subtotal:", totals.subtotal);
console.log("Delivery Fee:", totals.deliveryFee);
console.log("Total:", totals.total);
console.log("Restaurants:", totals.restaurantCount);
```

### Transform Cart Data

```javascript
import { transformCartToOrderV2 } from "@/app/lib/orderTransformers";

const payload = transformCartToOrderV2(
  cart,                    // Array of cart items
  deliveryAddress,         // { addressLine, city, state, phone, label }
  userPhone,              // "+2348012345678"
  { "Restaurant A": "Extra spicy" }  // Optional notes per restaurant
);
```

---

## 🎨 UI Components

### Error Display

```javascript
import OrderErrorDisplay from "@/app/components/Checkout/OrderErrorDisplay";

<OrderErrorDisplay 
  error={errorMessage}
  onRetry={() => handleRetry()}
  onClose={() => setError(null)}
/>
```

### Processing Loader

```javascript
import OrderProcessingLoader from "@/app/components/Checkout/OrderProcessingLoader";

<OrderProcessingLoader 
  currentStep="calculating"  // validating | checking | calculating | preparing
/>
```

### Cart Validation Errors

```javascript
import { CartValidationErrors } from "@/app/components/Cart/CartValidator";

<CartValidationErrors 
  errors={validationErrors}
  onFixItem={(index) => navigateToItem(index)}
/>
```

### Cart Validation Hook

```javascript
import { useCartValidation } from "@/app/components/Cart/CartValidator";

const { validateCart, validationErrors, isValid } = useCartValidation(cart);

if (!isValid) {
  console.log("Validation errors:", validationErrors);
}
```

---

## ⚠️ Error Handling

### Error Types

```javascript
// Stock Error
{
  type: "stock",
  message: "Jollof Rice: Variant \"2 Portions\" is out of stock"
}

// Availability Error
{
  type: "availability",
  message: "Jollof Rice is not available"
}

// Restaurant Closed
{
  type: "closed",
  message: "Restaurant A is currently closed"
}

// Choice Validation
{
  type: "choice",
  message: "Invalid choice: Please select a protein"
}

// Address Error
{
  type: "address",
  message: "Invalid delivery address"
}
```

### Handling Errors

```javascript
try {
  const response = await createOrderV2(payload);
} catch (error) {
  // error.message contains user-friendly message
  
  if (error.message.includes("out of stock")) {
    // Handle stock error
  } else if (error.message.includes("closed")) {
    // Handle restaurant closed
  } else {
    // Generic error handling
  }
}
```

---

## 📊 Data Structures

### Cart Item

```javascript
{
  foodId: "64fa1234567890abcdef1234",
  restaurantId: "64fa1234567890abcdef5678",
  variantId: "var123",
  variantName: "1 Portion",
  name: "Jollof Rice",
  price: 3000,
  quantity: 2,
  image: "https://...",
  storeName: "Restaurant A",
  deliveryFee: 700,
  metadata: {
    spiceLevel: "Medium"
  }
}
```

### V2 Order Payload

```javascript
{
  items: [
    {
      foodId: "64fa1234567890abcdef1234",
      restaurantId: "64fa1234567890abcdef5678",
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
  ],
  vendorDeliveryFees: [
    {
      restaurantId: "64fa1234567890abcdef5678",
      deliveryFee: 700
    }
  ],
  deliveryAddress: {
    addressLine: "123 Main St, Apt 4B",
    city: "Lagos",
    state: "Lagos",
    phone: "+2348012345678",
    label: "Home"
  },
  phone: "+2348012345678"
}
```

### V2 Order Response

```javascript
{
  success: true,
  message: "Order initialized successfully",
  authorization_url: "https://checkout.paystack.com/...",
  access_code: "...",
  reference: "PSK_1234567890_abcd"
}
```

### V2 Verification Response

```javascript
{
  success: true,
  message: "Payment verified and order created",
  order: {
    _id: "...",
    orderId: "ORD-A1B2C3D4E5F6",
    subtotal: 7000,
    deliveryFee: 700,
    total: 7700,
    paymentStatus: "paid",
    orderStatus: "pending",
    deliveryAddress: {...},
    items: [...]
  },
  paystack: {
    reference: "PSK_1234567890_abcd",
    paid_at: "2026-01-26T10:00:00.000Z",
    amount: 7700
  }
}
```

---

## 🔧 Configuration

### API Base URL

```javascript
// Development
const API_URL = "http://localhost:3001/api";

// Production
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

### Cookie Configuration

Cookies are handled automatically by the browser. No configuration needed!

```javascript
// ✅ Automatic
await createOrderV2(payload);

// ❌ No longer needed
await createOrder(token, payload);
```

---

## 🧪 Testing

### Test Order Creation

```javascript
import { createOrderV2 } from "@/app/lib/orderService";

test("creates order successfully", async () => {
  const payload = {
    items: [...],
    vendorDeliveryFees: [...],
    deliveryAddress: {...},
    phone: "+2348012345678"
  };

  const response = await createOrderV2(payload);

  expect(response.success).toBe(true);
  expect(response.authorization_url).toBeDefined();
});
```

### Test Validation

```javascript
import { validateCartItems } from "@/app/lib/orderTransformers";

test("validates empty cart", () => {
  const validation = validateCartItems([]);

  expect(validation.isValid).toBe(false);
  expect(validation.errors[0].type).toBe("empty_cart");
});
```

### Test Transformation

```javascript
import { transformCartToOrderV2 } from "@/app/lib/orderTransformers";

test("transforms cart correctly", () => {
  const cart = [mockCartItem];
  const payload = transformCartToOrderV2(cart, address, phone, {});

  expect(payload.items).toHaveLength(1);
  expect(payload.items[0].foodId).toBe(mockCartItem.foodId);
});
```

---

## 📚 Resources

- **Full Documentation:** `/docs/ORDER_FLOW_V2.md`
- **Migration Guide:** `/docs/V2_MIGRATION_GUIDE.md`
- **Implementation Summary:** `/docs/V2_IMPLEMENTATION_SUMMARY.md`

---

## 💡 Tips & Best Practices

### ✅ Do's
- Always validate cart before submission
- Use `transformCartToOrderV2()` for data transformation
- Handle all error types appropriately
- Show loading states during processing
- Clear cart after successful order
- Log errors for debugging

### ❌ Don'ts
- Don't calculate prices on frontend
- Don't trust frontend validation alone
- Don't skip error handling
- Don't store tokens in localStorage
- Don't manually attach authorization headers
- Don't ignore validation errors

---

**Quick Reference Version:** 2.0  
**Last Updated:** 2026-01-26
