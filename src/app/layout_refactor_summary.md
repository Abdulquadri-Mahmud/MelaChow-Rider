# Layout Refactoring Summary

## Changes Implemented

### 1. Architecture Restructuring
Moved user-facing pages into a new **Route Group** `src/app/(customer)`. This separates customer routes from `vendors` and `admin`, allowing for cleaner layout management and context scoping.

- **Customer Pages**: Moved to `src/app/(customer)` (e.g., Home, Profile, Orders, Checkout).
- **Vendor Pages**: Remain in `src/app/vendors`.
- **Admin Pages**: Remain in `src/app/admin`.

### 2. Context Scoping
Context Providers are now scoped to their specific layouts to prevent "Race Conditions" and unnecessary re-renders.

- **Root Layout** (`src/app/layout.jsx`): Contains ONLY global providers (`ApiProvider`, `QueryProvider`, `Toaster`). No auth logic.
- **Customer Layout** (`src/app/(customer)/layout.jsx`): Wraps customer pages with `ProfileProvider` and `CartProvider`. Includes `CustomerBootstrapper`.
- **Vendor Layout** (`src/app/vendors/layout.jsx`): Wraps vendor pages with `VendorProfileProvider`. Includes `VendorBootstrapper`.
- **Admin Layout** (`src/app/admin/layout.jsx`): Wraps admin pages with `AdminProvider`. Includes `AdminLogoutHandler`.

### 3. Auth & Logout Handling
Split the global logout logic into dedicated handlers for each user type. This ensures that a 401 error in one context (e.g., Vendor) doesn't accidentally log out a User session, and vice versa.

- **Customer**: `CustomerLogoutHandler` (listens to `user:unauthorized`).
- **Vendor**: `VendorLogoutHandler` (listens to `vendor:unauthorized` and storage events).
- **Admin**: `AdminLogoutHandler` (listens to `admin:unauthorized`).

Each handler is automatically mounted within its respective layout/bootstrapper.

### 4. Code Cleanup
- **Deleted**: `ClientLayout.jsx` (replaced by scoped layouts).
- **Deleted**: `AppBootstrapper.jsx` (replaced by specific bootstrappers).
- **Deleted**: `GlobalLogoutHandler.jsx` (replaced by specific handlers).
- **Updated**: `ConditionalBottomNav.jsx` (Simplified logic).
- **Fixed**: Relative import paths in all moved files (Home, Profile, Orders, Checkout, etc.) to use absolute paths (`@/app/...`).

## Verification
- **User Flow**: Tested imports for Home, Profile, Orders, Checkout, VerifyPayment.
- **Vendor Flow**: Verified Layout and Bootstrapper structure.
- **Admin Flow**: Verified Layout and Logout Handler.

## Next Steps
- Verify the application functionality in the browser.
- Check `track-orders` and `food-details` pages to ensure they load correctly (imports verified).
- Confirm that 401 errors correctly trigger logout in their respective sections.
