# iOS Session Restoration Fix

## Overview
We identified a race condition on iOS browsers where page refreshes could lead to an apparent "auto-logout". This was caused by the application checking for authentication status before the secure HTTP-only cookies were fully processed or attached by the browser, triggering an immediate redirect to the login page.

## Changes Implemented

### 1. Robust Auth Retry Logic (`src/app/context/ProfileContext.jsx`)
We modified the user profile fetching logic to be more resilient during application boot:

- **Soft 401 Handling on Protected Routes:** 
  Previously, a 401 (Unauthorized) response immediately marked the user as a "Guest" (null). Now, if a 401 occurs while the user is on a protected route (e.g., `/home`, `/profile`), we treat it as a potential transient failure instead of a definitive logout.
  
- **Query Retries:**
  We updated the `useQuery` configuration to explicitly retry requests that fail with a specific "Session check failed (401)" error. The app will now retry the session check up to 2 times (approx. 1-3 seconds delay) before giving up. This provides a crucial grace period for iOS to restore cookies or for the TokenManager to initialize.

### 2. Startup Synchronization (`src/app/components/AppBootstrapper.jsx`)
The bootstrapper correctly respects the `isLoading` state from `ProfileContext`. Since `react-query` keeps `isLoading` true during the retry phase, the entire application (including redirect logic) waits until the retries are exhausted. This prevents premature redirects while the session check is still in progress.

### 3. Architecture Preservation
- **No Global State Changes:** We did not introduce new stores or complex state machines.
- **No API Changes:** The backend contract remains untouched.
- **Backward Compatibility:** Guest users on public routes (like Landing Page) still get instant 401 -> Guest resolution without unnecessary delays.

## Validation
- **Android:** Unchanged behavior. Authenticated users load usually instantly.
- **iOS:** Refreshes now hold the loading state slightly longer if the first check fails, successfully restoring the session on the 2nd attempt instead of logging out.
