# MelaChow Frontend - Food/Menu Management System Exploration

## 1. Menu API Structure & Location

**File:** [src/app/lib/menuApi.js](src/app/lib/menuApi.js)

### API Pattern
- **Axios Setup:** Uses custom `getMenuAxios()` with Auth Bearer token
- **Base URL:** Proxy through Next.js API (empty baseURL) to avoid CORS
- **API Gateway:** Hits `/v1/menu/` and `/v1/vendors/` endpoints

### Key Exported Functions:

#### Platform Categories (Public)
```javascript
export const getPlatformCategories = async () => {
  const res = await getMenuAxios().get('/v1/menu/platform-categories');
  return res.data;
};
```

#### Menu Items (CRUD)
```javascript
// Create menu item (Step 1)
export const createMenuItem = async (vendorId, payload) => {
  // Payload: { platform_category_id, vendor_section_id, name, description, 
  //           image_url, item_type, prep_time_minutes, tags }
  const res = await getMenuAxios().post(`/v1/menu/${vendorId}/items`, payload);
  return res.data;
};

// Update
export const updateMenuItem = async (vendorId, itemId, payload) => { ... };

// Hard delete (removes item + ALL portions, choice groups, options)
export const deleteMenuItem = async (vendorId, itemId) => { ... };

// Soft archive (sets is_archived: true)
export const archiveMenuItem = async (vendorId, itemId, archived) => { ... };

// Fetch all items with filters
export const getVendorMenuItems = async (vendorId, params = {}) => {
  // params: { status, section, search, page, limit }
  const res = await getMenuAxios().get(`/v1/menu/${vendorId}/items`, { params });
  return res.data;
};

// Fetch single item detail with full choice groups
export const getMenuItemDetail = async (vendorId, itemId) => {
  const res = await getMenuAxios().get(`/v1/vendors/${vendorId}/menu/items/${itemId}`);
  return res.data;  // { success, item, portions, choice_groups }
};
```

#### Portions (Step 2)
```javascript
// Add portion to item
export const addPortion = async (vendorId, itemId, payload) => {
  // Payload: { label, price (IN KOBO), is_default, max_quantity, sort_order }
  // â‚¦500 = 50000 kobo
  return await axios.post(`/v1/menu/${vendorId}/items/${itemId}/portions`, payload);
};

export const updatePortion = async (vendorId, itemId, portionId, payload) => { ... };
export const deleteMenuItemPortion = async (vendorId, itemId, portionId) => { ... };
export const togglePortionStock = async (vendorId, itemId, portionId, is_in_stock) => { ... };
```

#### Choice Groups & Options (Step 3-4)
```javascript
// Add choice group (e.g., "Choose your protein")
export const addChoiceGroup = async (vendorId, itemId, payload) => {
  // Payload: { name, min_selections, max_selections, is_required, sort_order }
  return await axios.post(`/v1/menu/${vendorId}/items/${itemId}/choice-groups`, payload);
};

export const updateChoiceGroup = async (vendorId, itemId, groupId, payload) => { ... };
export const deleteChoiceGroup = async (vendorId, itemId, groupId) => { ... };

// Add option to choice group
export const addChoiceOption = async (vendorId, itemId, groupId, payload) => {
  // Payload: { label, price_modifier (IN KOBO), ... }
  return await axios.post(`/v1/menu/${vendorId}/items/${itemId}/choice-groups/${groupId}/options`, payload);
};
```

#### Vendor Sections
```javascript
export const getVendorSections = async (vendorId) => { ... };
export const createVendorSection = async (vendorId, name) => { ... };
export const updateVendorSection = async (vendorId, sectionId, data) => { ... };
export const deleteVendorSection = async (vendorId, sectionId) => { ... };
```

#### Availability & Stock
```javascript
export const toggleMenuItemAvailability = async (vendorId, itemId) => { ... };
export const toggleMenuItemStock = async (vendorId, itemId, is_in_stock) => { ... };
```

---

## 2. Create Food Store (Zustand)

**File:** [src/app/context/CreateFoodStore.js](src/app/context/CreateFoodStore.js)

### Store Shape & Patterns

```javascript
export const useCreateFoodStore = create(
  persist(
    (set, get) => ({
      // â”€â”€â”€ STEP 1: BASIC INFO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      name: "",                                  // string
      description: "",                           // string
      image_url: null,                          // string | null
      item_type: "FOOD",                        // enum: FOOD, DRINK, SIDE, SOUP, SWALLOW, PROTEIN
      dietary_type: "mixed",                    // enum: mixed, vegetarian, vegan
      prep_time_minutes: 20,                    // number
      tags: [],                                  // string[]

      // â”€â”€â”€ STEP 2: CATEGORY & SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      platform_category_id: null,               // string (leaf category ID)
      platform_category_label: null,             // string (for display)
      vendor_section_id: null,                  // string | null (vendor's custom section)
      vendor_section_label: null,                // string (for display)

      // â”€â”€â”€ STEP 3: PORTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      portions: [
        // {
        //   tempId: generated UUID,
        //   label: "Small",
        //   price_naira: 5000,                  // â‚¦ amount
        //   is_default: true,
        //   max_quantity: null,
        //   sort_order: 0
        // }
      ],

      // â”€â”€â”€ STEP 4: CHOICE GROUPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      choice_groups: [
        // {
        //   tempId: generated UUID,
        //   name: "Choose Protein",
        //   is_required: true,
        //   min_selections: 1,
        //   max_selections: 1,
        //   sort_order: 0,
        //   options: [
        //     {
        //       tempId: UUID,
        //       label: "Chicken",
        //       price_modifier_naira: 0,
        //       sort_order: 0
        //     }
        //   ]
        // }
      ],

      // â”€â”€â”€ META â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      currentStep: 1,                           // wizardStep: 1-5
      isSubmitting: false,
      isDirty: false,                           // auto-set on any change
      createdItemId: null,                      // set after initial creation
      _id: null,                                // for update flows

      // â”€â”€â”€ ACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      setField: (field, value) => set((state) => ({
        ...state,
        [field]: value,
        isDirty: true
      })),

      setStep: (step) => set({ currentStep: step }),

      // Tags
      addTag: (tag) => {
        const t = tag.trim().toLowerCase();
        if (t && get().tags.length < 6 && !get().tags.includes(t)) {
          set((state) => ({ tags: [...state.tags, t], isDirty: true }));
        }
      },
      removeTag: (tag) => set((state) => ({
        tags: state.tags.filter((t) => t !== tag),
        isDirty: true
      })),

      // Portions
      addPortion: (portion) => set((state) => ({
        portions: [...state.portions, portion],
        isDirty: true
      })),
      updatePortion: (tempId, updates) => set((state) => ({
        portions: state.portions.map((p) =>
          p.tempId === tempId ? { ...p, ...updates } : p
        ),
        isDirty: true
      })),
      removePortion: (tempId) => set((state) => ({
        portions: state.portions.filter((p) => p.tempId !== tempId),
        isDirty: true
      })),
      setDefaultPortion: (tempId) => set((state) => ({
        portions: state.portions.map((p) => ({
          ...p,
          is_default: p.tempId === tempId
        })),
        isDirty: true
      })),

      // Choice Groups
      addChoiceGroup: (group) => set((state) => ({
        choice_groups: [...state.choice_groups, group],
        isDirty: true
      })),
      updateChoiceGroup: (tempId, updates) => set((state) => ({
        choice_groups: state.choice_groups.map((g) =>
          g.tempId === tempId ? { ...g, ...updates } : g
        ),
        isDirty: true
      })),
      removeChoiceGroup: (tempId) => set((state) => ({
        choice_groups: state.choice_groups.filter((g) => g.tempId !== tempId),
        isDirty: true
      })),

      // Choice Options
      addChoiceOption: (groupId, option) => set((state) => ({
        choice_groups: state.choice_groups.map((g) =>
          g.tempId === groupId
            ? { ...g, options: [...g.options, option] }
            : g
        ),
        isDirty: true
      })),
      updateChoiceOption: (groupId, optionId, updates) => { ... },
      removeChoiceOption: (groupId, optionId) => { ... },

      // Init/Update from existing food
      initFromFood: (food) => set({
        _id: food._id,
        name: food.name || "",
        description: food.description || "",
        // ... (populate all fields from existing food)
      })
    }),
    {
      name: "create-food-store",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
```

### Usage in Components
```javascript
// In any component:
const store = useCreateFoodStore();

// Read state
const { name, portions, currentStep } = store;

// Update state
store.setField("name", "New Dish Name");
store.addPortion({ tempId: uuid(), label: "Medium", ... });
store.setStep(2);
```

---

## 3. Food Wizard Step Components

**Base Location:** [src/app/components/create-food/wizard/](src/app/components/create-food/wizard/)

### Step 1 - Basic Info
**File:** [Step1BasicInfo.jsx](src/app/components/create-food/wizard/Step1BasicInfo.jsx)

- Food name, description, image upload
- Item type selector (FOOD, DRINK, SIDE, SOUP, SWALLOW, PROTEIN)
- Dietary type (mixed, vegetarian, vegan)
- Prep time
- Tags management (max 6 tags)
- Cloudinary image upload integration

**Pattern:** Client component using `useCreateFoodStore`, Cloudinary API

### Step 2 - Categories
**File:** [Step2Categories.jsx](src/app/components/create-food/wizard/Step2Categories.jsx)

- Platform category tree browser (Root â†’ Leaf categories)
- Vendor sections list (custom sections created by vendor)
- Category search
- Create new section functionality
- Section templates (Rice Dishes, Soups & Swallows, etc.)

**Pattern:** Fetches categories via `getPlatformCategories()`, sections via `getVendorSections()`, builds category tree with root + subcategories

### Step 3 - Portions
**File:** [Step3Portions.jsx](src/app/components/create-food/wizard/Step3Portions.jsx)

- Add/edit/delete portions (Small, Medium, Large, etc.)
- Price input (Naira - converted to Kobo for API)
- Max quantity per portion
- Default portion selector
- Portion presets (Small, Medium, Large, etc.)

**Pattern:** Form state + store actions, price validation ensures prices increase with size

### Step 4 - Add-Ons (Choice Groups)
**File:** [Step4AddOns.jsx](src/app/components/create-food/wizard/Step4AddOns.jsx)

- Create/edit choice groups (e.g., "Choose Protein")
- Min/Max selection rules
- Add options to groups (with price modifiers)
- Group name presets (Protein, Sauce, Sides, etc.)
- Group title templates organized by category

**Pattern:** Nested form state for groups and options, preset templates for common groups

### Step 5 - Review
**File:** [Step5Review.jsx](src/app/components/create-food/wizard/Step5Review.jsx)

- Preview all entered data
- Final submission
- Creates menu item â†’ portions â†’ choice groups â†’ options sequentially

**Pattern:** Calls `createMenuItem()` then `addPortion()` for each portion, then `addChoiceGroup()` and `addChoiceOption()` for each group/option

---

## 4. Custom Hooks for Food Management

### useVendorFoods Hook
**Location:** [src/app/hooks/useVendorFoods.js](src/app/hooks/useVendorFoods.js)

```javascript
export const useVendorFoods = (vendorId, filters = {}) => {
  return useQuery({
    queryKey: ["vendor-foods", vendorId, filters],
    queryFn: () => getVendorMenuItems(vendorId, filters),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,           // 2 minutes
    placeholderData: keepPreviousData,  // smooth UI updates
  });
};

// Returns: { data, isLoading, isError, ... }
// data shape: { items, stats, pagination }
```

**Usage in [vendors/my-foods/page.jsx](src/app/vendors/my-foods/page.jsx)**
```javascript
const filters = {
  status: "all",          // all, active, archived
  section: null,          // filter by section ID
  search: "debouncedSearch",
  page: 1,
  limit: 50
};

const { data, isLoading, isError, isFetching } = useVendorFoods(vendorId, filters);
const items = data?.items || [];
```

### useFoodById Hook
**Location:** [src/app/hooks/useVendorFoodQuery.js](src/app/hooks/useVendorFoodQuery.js)

```javascript
export const useFoodById = (foodId, vendorId) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["food-item", foodId],
    queryFn: () => getMenuItemDetail(vendorId, foodId),
    // Uses /v1/vendors/{vendorId}/menu/items/{itemId} endpoint
    enabled: !!foodId && !!vendorId,
    staleTime: 1000 * 60 * 5,           // 5 minutes
    retry: 2,
  });

  return {
    food: data,       // { success, item, portions, choice_groups }
    isLoading,
    isError,
    error,
  };
};
```

**Usage Pattern:**
```javascript
const { food, isLoading } = useFoodById(foodId, vendorId);
// food.item contains full menu item with populated choice_groups
// food.portions contains all portion objects
// food.choice_groups contains all choice groups with options
```

### Additional Hooks
- **[useVendorQueries.js](src/app/hooks/useVendorQueries.js)** - Vendor profile queries with optimistic updates
- **[useCategories.js](src/app/hooks/useCategories.js)** - Category management
- **[useMenu.js](src/app/hooks/useMenu.js)** - Menu-related queries

---

## 5. Vendor Navigation Structure

**File:** [src/app/components/vendors_component/layout/Sidebar.jsx](src/app/components/vendors_component/layout/Sidebar.jsx)

### Navigation Items Array
```javascript
const navItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/vendors/dashboard",
  },
  {
    name: "Transactions",
    icon: Wallet,
    href: "/vendors/transactions",
  },
  {
    name: "Coupons",
    icon: TicketPercent,
    href: "/vendors/coupons",
  },
  {
    name: "Orders",
    icon: ClipboardList,
    href: "/vendors/order",
  },
  {
    name: "Riders",
    icon: Bike,
    href: "/vendors/riders",
  },
  {
    name: "Notifications",
    icon: Bell,
    href: "/vendors/notifications",
  },
  {
    name: "My Foods",           // â† FOOD MANAGEMENT
    icon: UtensilsCrossed,
    href: "/vendors/my-foods",
  },
  {
    name: "Create Food",        // â† CREATE FOOD WIZARD
    icon: PlusCircle,
    href: "/vendors/create-food",
  },
  {
    name: "Reviews",
    icon: Star,
    href: "/vendors/reviews",
  },
  {
    name: "Profile",
    icon: User,
    href: "/vendors/profile",
  },
  {
    name: "Help & FAQs",
    icon: HelpCircle,
    href: "/vendors/faqs",
  },
];
```

### Sidebar Features
- **Collapsible:** Toggles between expanded (280px) and collapsed (80px) on desktop
- **Mobile Responsive:** Full width drawer on mobile with backdrop
- **Active State Detection:** Uses `pathname?.includes(href)` to highlight current section
- **Logout Handler:** Calls `/vendor/auth/logout` endpoint
- **Icons:** All from lucide-react
- **Theme Support:** Dark mode compatible (uses slate colors with dark variants)

---

## 6. Reusable Components for Food Management

### Create Food Section Components
**Location:** [src/app/components/create-food/](src/app/components/create-food/)

#### SectionHeader.jsx
```javascript
<SectionHeader
  title="Choice Groups"
  subtitle={`${choiceGroups.length} group${choiceGroups.length !== 1 ? "s" : ""}`}
  icon={List}
  section="choiceGroups"
  isExpanded={expanded}
  onToggle={toggleExpanded}
  accentColor="blue"  // blue, green, purple, pink
/>
```

#### ChoiceGroupsSection.jsx
- Manage multiple choice groups with add/edit/delete
- Auto-suggest preset names based on food category
- Supports unlimited options per group
- Min/max selection validation

#### PortionsSection.jsx
- Portion scaling (Small, Medium, Large presets)
- Price input with Naira to Kobo conversion
- Dynamic price validation
- Default portion selector

#### ImagesSection.jsx
- Multiple image upload (max 5)
- Cloudinary integration
- Primary image indicator
- Image preview and delete

#### DetailsSection.jsx
- Food name, description
- Item type dropdown
- Dietary type selection
- Prep time input

#### TagsSection.jsx
- Tag management with suggestions
- Auto-complete on Enter, Comma, or Backspace
- Max 6 tags
- Visual chip display

#### MetadataSection.jsx
- Additional metadata fields

### Food Display Components
**Location:** [src/app/vendors/my-foods/components/](src/app/vendors/my-foods/components/)

#### FoodCard.jsx
- Display single food item
- Shows availability toggle
- Edit/delete/archive buttons
- Quick action menu

#### FoodCardSkeleton.jsx
- Loading skeleton for food cards

#### FoodsFilterBar.jsx
- Search input
- Status filter (All, Active, Archived)
- Section/category filter
- Sort options

#### EmptyFoods.jsx
- Empty state display for no foods

### Edit Food Modal Components
**Location:** [src/app/components/vendors_component/foods/](src/app/components/vendors_component/foods/)

#### EditFoodModal.jsx
- Modal for editing existing food
- Calls `/v1/menu/{vendorId}/items/{itemId}` PUT endpoint

#### DeleteModal.jsx
- Confirmation modal for deletion
- Soft delete (archive) option

#### AddFoodModal.jsx
- Quick add modal (alternative to full wizard)

#### FoodTable.jsx
- Table view of foods (alternative to cards)

---

## 7. Folder Structure for /vendors/my-foods/

```
src/app/vendors/my-foods/
â”œâ”€â”€ page.jsx                    # Main foods list page
â”œâ”€â”€ [id]/
â”‚   â”œâ”€â”€ page.jsx               # Single food detail page
â”‚   â””â”€â”€ edit/
â”‚       â””â”€â”€ page.jsx           # Edit single food page
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ EmptyFoods.jsx         # Empty state
â”‚   â”œâ”€â”€ FoodCard.jsx           # Single food card component
â”‚   â”œâ”€â”€ FoodCardSkeleton.jsx   # Loading skeleton
â”‚   â””â”€â”€ FoodsFilterBar.jsx     # Search/filter component
â””â”€â”€ filter-section.txt          # (documentation)
```

### My Foods Page Flow

**[page.jsx](src/app/vendors/my-foods/page.jsx) Pattern:**
```javascript
export default function MyFoodsPage() {
  const { vendorProfile } = useVendorProfile();
  const vendorId = vendorProfile?._id || vendorProfile?.id;

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [activeSection, setActiveSection] = useState(null);
  const [page, setPage] = useState(1);

  // Query foods with filters
  const { data, isLoading, isError, isFetching } = useVendorFoods(
    vendorId,
    { status, section: activeSection, search, page, limit: 50 }
  );

  const items = data?.items || [];
  const stats = data?.stats || {};  // { total, active, archived }
  const pagination = data?.pagination || {};

  // Derive unique sections for filter
  const sections = useMemo(() => {
    const seen = new Map();
    items.forEach(item => {
      if (item.section && !seen.has(item.section._id)) {
        seen.set(item.section._id, item.section);
      }
    });
    return Array.from(seen.values());
  }, [items]);

  // Actions
  const invalidate = () => {
    queryClient.invalidateQueries(["vendor-foods", vendorId]);
  };

  const handleToggleAvailability = async (itemId) => {
    await toggleMenuItemAvailability(vendorId, itemId);
    invalidate();
  };

  const handleArchive = async (itemId) => {
    await archiveMenuItem(vendorId, itemId, true);
    invalidate();
  };

  const handleDelete = async (itemId) => {
    await deleteMenuItem(vendorId, itemId);
    invalidate();
  };

  // Render
  return (
    <>
      <FoodsFilterBar
        search={search}
        onSearchChange={handleSearch}
        status={status}
        onStatusChange={setStatus}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <FoodCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyFoods />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <FoodCard
              key={item._id}
              food={item}
              onEdit={() => router.push(`/vendors/my-foods/${item._id}/edit`)}
              onToggleAvailability={() => handleToggleAvailability(item._id)}
              onArchive={() => handleArchive(item._id)}
              onDelete={() => handleDelete(item._id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
```

---

## 8. Create Food Wizard Page Flow

**File:** [src/app/vendors/create-food/page.jsx](src/app/vendors/create-food/page.jsx)

### Wizard Structure
```javascript
const STEPS = [
  { id: 1, title: "Basic Info", short: "Basics" },
  { id: 2, title: "Category", short: "Category" },
  { id: 3, title: "Pricing", short: "Price" },
  { id: 4, title: "Extras", short: "Add-Ons" },
  { id: 5, title: "Review", short: "Done" },
];

export default function CreateFoodWizardPage() {
  const store = useCreateFoodStore();
  const router = useRouter();

  // Navigation
  const handleNext = () => store.setStep(Math.min(5, store.currentStep + 1));
  const handleBack = () => store.setStep(Math.max(1, store.currentStep - 1));
  const handleJump = (stepId) => {
    if (stepId < store.currentStep) store.setStep(stepId);  // Only backward
  };

  // Validation
  const validateStep = () => {
    if (store.currentStep === 1) {
      if (!store.name.trim() || store.name.length < 2) return false;
      if (!store.item_type) return false;
    }
    if (store.currentStep === 2) {
      if (!store.platform_category_id) return false;  // Required
    }
    if (store.currentStep === 3) {
      if (store.portions.length === 0) return false;
    }
    if (store.currentStep === 4) {
      for (const g of store.choice_groups) {
        if (g.options.length === 0) return false;
      }
    }
    return true;
  };

  // Render current step
  return (
    <>
      {/* Progress bar */}
      <div className="progress-bar">
        {STEPS.map(step => (
          <button
            key={step.id}
            onClick={() => handleJump(step.id)}
            className={step.id === store.currentStep ? "active" : ""}
          >
            {step.short}
          </button>
        ))}
      </div>

      {/* Step components */}
      {store.currentStep === 1 && <Step1BasicInfo onNext={handleNextWithValidation} />}
      {store.currentStep === 2 && <Step2Categories onBack={handleBack} onNext={handleNextWithValidation} />}
      {store.currentStep === 3 && <Step3Portions onBack={handleBack} onNext={handleNextWithValidation} />}
      {store.currentStep === 4 && <Step4AddOns onBack={handleBack} onNext={handleNextWithValidation} />}
      {store.currentStep === 5 && <Step5Review onBack={handleBack} />}

      {/* Navigation buttons */}
      <div className="flex gap-4">
        <button onClick={handleBack}>Back</button>
        <button onClick={handleNextWithValidation}>{getNextLabel()}</button>
      </div>
    </>
  );
}
```

---

## 9. Key Patterns & Best Practices Identified

### API Call Pattern
1. Use `menuApi.js` for all food-related API calls
2. Always pass `vendorId` as the identifier
3. Prices handled in **Kobo** internally (multiply Naira by 100)
4. Display prices to users in **Naira** (divide Kobo by 100 for display)

### State Management Pattern
- **Zustand** for wizard/form state (`CreateFoodStore`)
- **TanStack Query** for async server state (`useVendorFoods`, `useFoodById`)
- **LocalStorage persistence** for incomplete wizard forms

### Component Structure
- **Wizard steps** are isolated components with their own form logic
- **Section components** are reusable (ChoiceGroupsSection, PortionsSection, etc.)
- **Display lists** use TanStack Query with `keepPreviousData` for smooth UI
- Use **Framer Motion** for page transitions and animations

### Validation Pattern
- Client-side validation before each step (name, category, portions, choice options)
- Server-side validation via API responses
- Guard conditions on delete operations (e.g., can't delete last portion)

### Async Operations
- Use `react-hot-toast` for success/error notifications
- Invalidate React Query cache after mutations
- Show loading states during API calls
- Debounce search inputs (350ms) for filtering

---

## Summary of Full Paths

| Component | Full Path |
|-----------|-----------|
| Menu API | `src/app/lib/menuApi.js` |
| Create Food Store | `src/app/context/CreateFoodStore.js` |
| Step 1 - Basic Info | `src/app/components/create-food/wizard/Step1BasicInfo.jsx` |
| Step 2 - Categories | `src/app/components/create-food/wizard/Step2Categories.jsx` |
| Step 3 - Portions | `src/app/components/create-food/wizard/Step3Portions.jsx` |
| Step 4 - Add-Ons | `src/app/components/create-food/wizard/Step4AddOns.jsx` |
| Step 5 - Review | `src/app/components/create-food/wizard/Step5Review.jsx` |
| useVendorFoods Hook | `src/app/hooks/useVendorFoods.js` |
| useFoodById Hook | `src/app/hooks/useVendorFoodQuery.js` |
| useVendorQueries Hook | `src/app/hooks/useVendorQueries.js` |
| Vendor Sidebar | `src/app/components/vendors_component/layout/Sidebar.jsx` |
| Dashboard Layout | `src/app/components/vendors_component/layout/DashboardLayout.jsx` |
| My Foods Page | `src/app/vendors/my-foods/page.jsx` |
| Food Card | `src/app/vendors/my-foods/components/FoodCard.jsx` |
| Foods Filter Bar | `src/app/vendors/my-foods/components/FoodsFilterBar.jsx` |
| Create Food Page | `src/app/vendors/create-food/page.jsx` |
| Food Components | `src/app/components/create-food/` |
| Section Components | `src/app/components/vendors_component/foods/` |
| Vendor Components | `src/app/components/vendors_component/layout/` |

