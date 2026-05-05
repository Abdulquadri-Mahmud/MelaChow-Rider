# Location System - Quick Reference Guide

## 🚀 Quick Start

### **Using Locations in Your Component**

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function MyComponent() {
  const [locations, setLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        'https://grub-dash-api.vercel.app/api/user/locations',
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateChange = (e) => {
    const stateId = e.target.value;
    setSelectedStateId(stateId);
    
    // Update cities for selected state
    const selectedLocation = locations.find(loc => loc.stateId === stateId);
    setCities(selectedLocation?.cities || []);
    setSelectedCityId(''); // Reset city
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get names from IDs
    const selectedLocation = locations.find(loc => loc.stateId === selectedStateId);
    const selectedCity = cities.find(city => city.cityId === selectedCityId);
    
    // Submit with NAMES, not IDs
    const data = {
      state: selectedLocation.state,  // String name
      city: selectedCity.name,        // String name
      // ... other fields
    };
    
    // Send to your endpoint
    await axios.post('/your-endpoint', data, { withCredentials: true });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* State Dropdown */}
      <select 
        value={selectedStateId} 
        onChange={handleStateChange}
        required
      >
        <option value="">Select State</option>
        {locations.map(loc => (
          <option key={loc.stateId} value={loc.stateId}>
            {loc.state}
          </option>
        ))}
      </select>

      {/* City Dropdown */}
      <select 
        value={selectedCityId} 
        onChange={(e) => setSelectedCityId(e.target.value)}
        disabled={!selectedStateId}
        required
      >
        <option value="">
          {!selectedStateId ? 'Select state first' : 'Select City'}
        </option>
        {cities.map(city => (
          <option key={city.cityId} value={city.cityId}>
            {city.name}
          </option>
        ))}
      </select>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 📋 API Reference

### **Get Available Locations**
```
GET /api/user/locations
```

**Response:**
```json
{
  "success": true,
  "locations": [
    {
      "state": "Lagos",
      "stateId": "67a1b2c3d4e5f6...",
      "cities": [
        {
          "name": "Ikeja",
          "cityId": "67a1b2c3d4e5f6..."
        },
        {
          "name": "Lekki",
          "cityId": "67a1b2c3d4e5f6..."
        }
      ]
    }
  ]
}
```

---

## ⚠️ Important Rules

### **1. Always Send Names, Not IDs**
```javascript
// ❌ WRONG
const data = {
  stateId: selectedStateId,
  cityId: selectedCityId
};

// ✅ CORRECT
const selectedLocation = locations.find(loc => loc.stateId === selectedStateId);
const selectedCity = cities.find(city => city.cityId === selectedCityId);

const data = {
  state: selectedLocation.state,  // Send name
  city: selectedCity.name         // Send name
};
```

### **2. Always Include Credentials**
```javascript
// ✅ CORRECT
await axios.get('/api/user/locations', {
  withCredentials: true  // Required for cookies
});

// Or with fetch
await fetch('/api/user/locations', {
  credentials: 'include'  // Required for cookies
});
```

### **3. Reset City When State Changes**
```javascript
const handleStateChange = (e) => {
  const stateId = e.target.value;
  setSelectedStateId(stateId);
  
  // Update cities
  const selectedLocation = locations.find(loc => loc.stateId === stateId);
  setCities(selectedLocation?.cities || []);
  
  // ✅ IMPORTANT: Reset city selection
  setSelectedCityId('');
};
```

### **4. Disable City Dropdown When No State**
```javascript
<select 
  disabled={!selectedStateId}  // ✅ Disable if no state
  value={selectedCityId}
  onChange={(e) => setSelectedCityId(e.target.value)}
>
  <option value="">
    {!selectedStateId ? 'Select state first' : 'Select City'}
  </option>
  {cities.map(city => (
    <option key={city.cityId} value={city.cityId}>
      {city.name}
    </option>
  ))}
</select>
```

---

## 🎨 UI Patterns

### **Loading State**
```javascript
{isLoading && (
  <div className="flex items-center gap-2">
    <Loader2 className="animate-spin" size={20} />
    <span>Loading locations...</span>
  </div>
)}
```

### **Error State**
```javascript
{error && (
  <div className="bg-red-50 border border-red-200 rounded p-4">
    <p className="text-red-800">{error}</p>
    <button onClick={fetchLocations}>Retry</button>
  </div>
)}
```

### **Empty State**
```javascript
{!isLoading && locations.length === 0 && (
  <div className="text-center p-6">
    <p className="text-gray-600">No locations available</p>
    <p className="text-sm text-gray-500">Please contact support</p>
  </div>
)}
```

---

## 🔧 Common Patterns

### **Pre-populate on Edit**
```javascript
const handleEdit = (address) => {
  // Find state
  const stateLocation = locations.find(loc => loc.state === address.state);
  if (stateLocation) {
    setSelectedStateId(stateLocation.stateId);
    setCities(stateLocation.cities || []);
    
    // Find city
    const cityLocation = stateLocation.cities.find(
      city => city.name === address.city
    );
    if (cityLocation) {
      setSelectedCityId(cityLocation.cityId);
    }
  }
};
```

### **Validation**
```javascript
const validate = () => {
  if (!selectedStateId || !selectedCityId) {
    toast.error('Please select both state and city');
    return false;
  }
  return true;
};
```

---

## 🐛 Troubleshooting

### **Problem: Locations not loading**
**Solution:**
1. Check if API is running
2. Verify credentials are being sent
3. Check browser console for errors
4. Check network tab for 401/404 errors

### **Problem: Cities not updating when state changes**
**Solution:**
```javascript
// Make sure you're updating cities AND resetting city selection
const handleStateChange = (e) => {
  const stateId = e.target.value;
  setSelectedStateId(stateId);
  
  const selectedLocation = locations.find(loc => loc.stateId === stateId);
  setCities(selectedLocation?.cities || []);
  setSelectedCityId(''); // ← Don't forget this!
};
```

### **Problem: Backend says "Invalid location"**
**Solution:**
- Make sure you're sending **names**, not IDs
- Check that the names exactly match what's in the database
- Verify the location is active in the admin panel

---

## 📚 Examples

### **Example 1: Simple Address Form**
See: `src/app/components/user_profile/UserAddress.jsx`

### **Example 2: Admin Location Management**
See: `src/app/admin/locations/page.jsx`

---

## 🎯 Checklist for New Components

When adding location selection to a new component:

- [ ] Import necessary hooks and axios
- [ ] Add state for locations, cities, selectedStateId, selectedCityId
- [ ] Add isLoading and error states
- [ ] Fetch locations on component mount
- [ ] Implement handleStateChange to update cities
- [ ] Disable city dropdown when no state selected
- [ ] Show loading/error/empty states
- [ ] Submit with location NAMES, not IDs
- [ ] Include withCredentials: true in API calls
- [ ] Add proper validation
- [ ] Test edit functionality if applicable

---

## 💡 Tips

1. **Cache Locations**: Locations don't change often, consider caching
2. **Error Handling**: Always show user-friendly error messages
3. **Loading States**: Use skeletons or spinners for better UX
4. **Validation**: Validate before submission
5. **Accessibility**: Use proper labels and ARIA attributes

---

## 🔗 Related Files

- User Address Component: `src/app/components/user_profile/UserAddress.jsx`
- Admin Location Panel: `src/app/admin/locations/page.jsx`
- API Context: `src/app/context/ApiContext.jsx`
- Implementation Docs: `LOCATION_SYSTEM_IMPLEMENTATION.md`

---

*Last Updated: 2026-01-30*
