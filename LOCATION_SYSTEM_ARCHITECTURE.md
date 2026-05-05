# Location System Architecture

## 📐 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE (MongoDB)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   States     │  │    Cities    │  │   Vendors    │              │
│  │              │  │              │  │              │              │
│  │ - name       │  │ - name       │  │ - storeName  │              │
│  │ - isActive   │  │ - stateId    │  │ - state      │              │
│  │ - createdAt  │  │ - isActive   │  │ - city       │              │
│  └──────────────┘  └──────────────┘  │ - approved   │              │
│                                       └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
                                 │ API Calls
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js/Express)                     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      PUBLIC ENDPOINTS                           │ │
│  │  GET /api/user/locations                                        │ │
│  │  - Returns active states with active cities                     │ │
│  │  - Only locations with approved restaurants                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      ADMIN ENDPOINTS                            │ │
│  │  GET    /api/admin/locations/states                            │ │
│  │  POST   /api/admin/locations/states                            │ │
│  │  PATCH  /api/admin/locations/states/:id/activate               │ │
│  │                                                                  │ │
│  │  GET    /api/admin/locations/cities                            │ │
│  │  POST   /api/admin/locations/cities                            │ │
│  │  PATCH  /api/admin/locations/cities/:id/activate               │ │
│  │                                                                  │ │
│  │  GET    /api/admin/locations/location-requests                 │ │
│  │  PATCH  /api/admin/vendors/approve?vendorId=...                │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
                                 │ HTTP Requests (with cookies)
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js/React)                          │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    USER COMPONENTS                              │ │
│  │                                                                  │ │
│  │  UserAddress.jsx (/profile/address)                            │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ 1. Fetch locations from /api/user/locations              │  │ │
│  │  │ 2. Populate state dropdown                                │  │ │
│  │  │ 3. User selects state → populate cities                   │  │ │
│  │  │ 4. User selects city                                      │  │ │
│  │  │ 5. User enters street address                             │  │ │
│  │  │ 6. Submit with STATE NAME + CITY NAME                     │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │  Features:                                                       │ │
│  │  ✓ Dynamic location fetching                                    │ │
│  │  ✓ State-dependent city dropdown                                │ │
│  │  ✓ Loading/error states                                         │ │
│  │  ✓ Edit functionality with pre-population                       │ │
│  │  ✓ Validation                                                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    ADMIN COMPONENTS                             │ │
│  │                                                                  │ │
│  │  AdminLocationManagement (/admin/locations)                    │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ STATES TAB                                                │  │ │
│  │  │ - View all states                                         │  │ │
│  │  │ - Create new states                                       │  │ │
│  │  │ - Activate/deactivate states                              │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ CITIES TAB                                                │  │ │
│  │  │ - View all cities                                         │  │ │
│  │  │ - Create new cities under states                          │  │ │
│  │  │ - Activate/deactivate cities                              │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ PENDING REQUESTS TAB                                      │  │ │
│  │  │ - View vendor location requests                           │  │ │
│  │  │ - Approve vendors with location assignment                │  │ │
│  │  │ - Create locations during approval                        │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │  Features:                                                       │ │
│  │  ✓ Full CRUD operations                                         │ │
│  │  ✓ Backend status detection                                     │ │
│  │  ✓ Modal-based forms                                            │ │
│  │  ✓ Real-time updates                                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### **User Address Creation Flow**

```
┌─────────────┐
│   USER      │
│ Opens Page  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ UserAddress Component Mounts        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ fetchLocations()                     │
│ GET /api/user/locations             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend Returns:                     │
│ {                                    │
│   locations: [                       │
│     {                                │
│       state: "Lagos",                │
│       stateId: "abc123",             │
│       cities: [                      │
│         {name: "Ikeja", cityId: "x"}│
│       ]                              │
│     }                                │
│   ]                                  │
│ }                                    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ State Dropdown Populates             │
│ - Lagos                              │
│ - Ogun                               │
│ - ...                                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ User Selects State: "Lagos"          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ handleStateChange()                  │
│ - Find cities for "Lagos"            │
│ - setCities([...])                   │
│ - Reset city selection               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ City Dropdown Populates              │
│ - Ikeja                              │
│ - Lekki                              │
│ - ...                                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ User Selects City: "Ikeja"           │
│ User Enters Address: "123 Main St"   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ User Clicks "Save Location"          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ saveAddress()                        │
│ - Get state name from stateId        │
│ - Get city name from cityId          │
│ - Prepare data:                      │
│   {                                  │
│     state: "Lagos",  // NAME         │
│     city: "Ikeja",   // NAME         │
│     addressLine: "123 Main St"       │
│   }                                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/user/auth/address          │
│ with credentials                     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend:                             │
│ - Validates location exists          │
│ - Validates location is active       │
│ - Assigns stateId and cityId         │
│ - Saves to database                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Success Response                     │
│ - Toast: "Location added! 🏡"        │
│ - Address appears in list            │
│ - Form resets                        │
└─────────────────────────────────────┘
```

---

### **Admin Location Creation Flow**

```
┌─────────────┐
│   ADMIN     │
│ Opens Panel │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ AdminLocationManagement Mounts      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ checkBackendEndpoints()              │
│ GET /api/admin/locations/states     │
└──────┬──────────────────────────────┘
       │
       ├─── Success ────────────────┐
       │                             │
       ▼                             │
┌─────────────────────────────┐      │
│ Backend Available            │      │
│ - Fetch states               │      │
│ - Fetch cities               │      │
│ - Fetch pending requests     │      │
└──────┬──────────────────────┘      │
       │                             │
       ▼                             │
┌─────────────────────────────┐      │
│ Display Admin Interface      │      │
│ - States Tab                 │      │
│ - Cities Tab                 │      │
│ - Pending Requests Tab       │      │
└─────────────────────────────┘      │
                                      │
       ├─── 404 Error ───────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend Not Implemented              │
│ - Show implementation guide          │
│ - List required endpoints            │
│ - Provide retry button               │
└─────────────────────────────────────┘
```

---

### **Create State Flow**

```
┌─────────────┐
│   ADMIN     │
│ Clicks      │
│ "Add State" │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Modal Opens                          │
│ - Input field for state name         │
│ - Cancel button                      │
│ - Create button                      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Admin Enters: "Oyo"                  │
│ Admin Clicks "Create State"          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Validation                           │
│ - Check if name is not empty         │
└──────┬──────────────────────────────┘
       │
       ├─── Valid ──────────────────┐
       │                             │
       ▼                             │
┌─────────────────────────────┐      │
│ POST /api/admin/locations/   │      │
│      states                  │      │
│ Body: { name: "Oyo" }        │      │
└──────┬──────────────────────┘      │
       │                             │
       ▼                             │
┌─────────────────────────────┐      │
│ Backend:                     │      │
│ - Validates name             │      │
│ - Checks for duplicates      │      │
│ - Creates state              │      │
│ - Sets isActive: true        │      │
└──────┬──────────────────────┘      │
       │                             │
       ▼                             │
┌─────────────────────────────┐      │
│ Success Response             │      │
│ - Toast: "State created!"    │      │
│ - Modal closes               │      │
│ - Table refreshes            │      │
│ - New state appears          │      │
└─────────────────────────────┘      │
                                      │
       ├─── Invalid ──────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Error Toast                          │
│ "Please enter a state name"          │
│ Modal stays open                     │
└─────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────┐
│ User/Admin Makes Request             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Frontend Includes Credentials        │
│ - axios: withCredentials: true       │
│ - fetch: credentials: 'include'      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ HTTP-Only Cookie Sent                │
│ - Contains auth token                │
│ - Secure flag set                    │
│ - SameSite policy                    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend Middleware                   │
│ - Extracts token from cookie        │
│ - Verifies token                     │
│ - Attaches user/admin to request     │
└──────┬──────────────────────────────┘
       │
       ├─── Valid Token ────────────┐
       │                             │
       ▼                             │
┌─────────────────────────────┐      │
│ Request Proceeds             │      │
│ - Access granted             │      │
│ - Data returned              │      │
└─────────────────────────────┘      │
                                      │
       ├─── Invalid/Missing Token ───┘
       │
       ▼
┌─────────────────────────────────────┐
│ 401 Unauthorized                     │
│ - Frontend redirects to login        │
│ - User must re-authenticate          │
└─────────────────────────────────────┘
```

---

## 📊 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    UserAddress Component State               │
│                                                               │
│  locations: [                                                 │
│    {                                                          │
│      state: "Lagos",                                          │
│      stateId: "abc123",                                       │
│      cities: [                                                │
│        { name: "Ikeja", cityId: "xyz789" }                    │
│      ]                                                        │
│    }                                                          │
│  ]                                                            │
│                                                               │
│  cities: []  ← Updates when state changes                    │
│                                                               │
│  selectedStateId: ""  ← User's selection                     │
│  selectedCityId: ""   ← User's selection                     │
│                                                               │
│  isLoadingLocations: true/false                              │
│  locationError: null/string                                  │
│                                                               │
│  addresses: []  ← User's saved addresses                     │
│  editingId: null/string                                      │
│                                                               │
│  form: {                                                      │
│    addressLine: ""                                            │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Hierarchy

```
App
│
├── AppBootstrapper
│   ├── SplashScreen
│   └── ProfileProvider
│       └── UserAddress (/profile/address)
│           ├── Header
│           ├── AddressSkeleton (loading)
│           ├── EmptyState (no addresses)
│           ├── AddressForm
│           │   ├── StateDropdown
│           │   ├── CityDropdown (dependent)
│           │   ├── AddressInput
│           │   └── SubmitButton
│           ├── AddressList
│           │   └── AddressCard[]
│           │       ├── SetDefaultButton
│           │       ├── EditButton
│           │       └── DeleteButton
│           └── DeleteModal
│
└── AdminProtectedRoute
    └── AdminDashboardLayout
        └── AdminLocationManagement (/admin/locations)
            ├── BackendStatusCheck
            ├── Tabs
            │   ├── StatesTab
            │   ├── CitiesTab
            │   └── RequestsTab
            ├── StatesPanel
            │   ├── StatesTable
            │   └── CreateStateModal
            ├── CitiesPanel
            │   ├── CitiesTable
            │   └── CreateCityModal
            └── PendingRequestsPanel
                ├── RequestsTable
                └── ResolveRequestModal
```

---

*Architecture Documentation Version: 1.0*  
*Last Updated: 2026-01-30*
