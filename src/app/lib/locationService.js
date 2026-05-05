import axios from "axios";
import { getApiUrl } from "./apiConfig";

// Use API proxy for iOS Safari cookie fix
const baseUrl = getApiUrl();

/**
 * Location Service - Centralized location API calls with enhanced error handling and fallback
 */
export class LocationService {
  /**
   * Enhanced fetch available locations for users with fallback system
   * iOS-optimized with retry logic for cookie-based auth
   */
  static async fetchUserLocations() {
    try {
      // Try main endpoint first with iOS-specific headers
      let response = await axios.get(`${baseUrl}/user/locations`, {
        withCredentials: true,
        headers: {
          // ✅ iOS Safari-specific headers to prevent aggressive caching
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // ✅ Increased timeout for slow backend responses
        timeout: 30000, // 30 second timeout (backend might be slow)
      });

      let data = response.data;

      // Store debug info for development
      const debugInfo = data.debug || null;

      // If main endpoint returns empty results, try legacy fallback
      if (data.success && data.count === 0) {
        console.log('Main endpoint returned no locations, trying legacy fallback...');
        if (debugInfo) {
          console.log('Debug info:', debugInfo);
        }

        try {
          response = await axios.get(`${baseUrl}/user/locations/legacy`, {
            withCredentials: true,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            timeout: 30000, // Match main endpoint timeout
          });
          data = response.data;

          if (data.success && data.count > 0) {
            console.log('Using legacy locations:', data.locations);
            return {
              success: true,
              locations: data.locations || [],
              isLegacyMode: true,
              debugInfo: debugInfo,
              message: data.message || 'Using legacy location data'
            };
          } else {
            // Both endpoints failed or returned empty
            return {
              success: false,
              locations: [],
              isLegacyMode: false,
              debugInfo: debugInfo,
              error: 'No locations available. Please contact support.',
            };
          }
        } catch (legacyError) {
          console.error('Legacy endpoint also failed:', legacyError);
          return {
            success: false,
            locations: [],
            isLegacyMode: false,
            debugInfo: debugInfo,
            error: 'Failed to load locations from both main and legacy endpoints.',
          };
        }
      } else if (data.success && data.count > 0) {
        // Main endpoint worked
        // console.log('Using database-driven locations:', data.locations);
        return {
          success: true,
          locations: data.locations || [],
          isLegacyMode: false,
          debugInfo: debugInfo,
          message: data.message || 'Locations loaded successfully'
        };
      } else {
        throw new Error(data.message || 'Failed to fetch locations');
      }
    } catch (error) {
      console.error("Error fetching user locations:", error);

      // ✅ Check for timeout errors
      const isTimeoutError = error.code === 'ECONNABORTED' || error.message?.includes('timeout');

      // ✅ iOS-specific: Check if error is due to auth/cookie issues
      const isAuthError = error.response?.status === 401 || error.response?.status === 403;

      // ✅ Provide helpful error messages
      let errorMessage;
      if (isTimeoutError) {
        errorMessage = "Server is taking too long to respond. Please try again in a moment.";
      } else if (isAuthError) {
        errorMessage = "Please log in again to view locations";
      } else {
        errorMessage = error.response?.data?.message || "Error loading locations";
      }

      return {
        success: false,
        locations: [],
        isLegacyMode: false,
        debugInfo: null,
        error: errorMessage,
        isAuthError, // ✅ Flag to help UI handle auth-specific errors
        isTimeoutError, // ✅ Flag for timeout-specific handling
      };
    }
  }

  /**
   * Admin: Fetch all states
   */
  static async fetchStates() {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/states`, {
        withCredentials: true,
      });

      if (response.data.success) {
        return {
          success: true,
          states: response.data.states || [],
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to load states",
        };
      }
    } catch (error) {
      console.error("Error fetching states:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error loading states",
      };
    }
  }

  /**
   * Admin: Create new state
   */
  static async createState(name) {
    try {
      const response = await axios.post(
        `${baseUrl}/admin/locations/states`,
        { name: name.trim() },
        { withCredentials: true }
      );

      if (response.data.success) {
        return {
          success: true,
          state: response.data.state,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to create state",
        };
      }
    } catch (error) {
      console.error("Error creating state:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error creating state",
      };
    }
  }

  /**
   * Admin: Toggle state status
   */
  static async toggleStateStatus(stateId, isActive) {
    try {
      const response = await axios.patch(
        `${baseUrl}/admin/locations/states/${stateId}/activate`,
        { isActive },
        { withCredentials: true }
      );

      if (response.data.success) {
        return {
          success: true,
          state: response.data.state,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to update state status",
        };
      }
    } catch (error) {
      console.error("Error updating state status:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error updating state status",
      };
    }
  }

  /**
   * Admin: Fetch all cities
   */
  static async fetchCities() {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/cities`, {
        withCredentials: true,
      });

      if (response.data.success) {
        return {
          success: true,
          cities: response.data.cities || [],
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to load cities",
        };
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error loading cities",
      };
    }
  }

  /**
   * Admin: Create new city
   */
  static async createCity(name, stateId) {
    try {
      const response = await axios.post(
        `${baseUrl}/admin/locations/cities`,
        { name: name.trim(), stateId },
        { withCredentials: true }
      );

      if (response.data.success) {
        return {
          success: true,
          city: response.data.city,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to create city",
        };
      }
    } catch (error) {
      console.error("Error creating city:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error creating city",
      };
    }
  }

  /**
   * Admin: Toggle city status
   */
  static async toggleCityStatus(cityId, isActive) {
    try {
      const response = await axios.patch(
        `${baseUrl}/admin/locations/cities/${cityId}/activate`,
        { isActive },
        { withCredentials: true }
      );

      if (response.data.success) {
        return {
          success: true,
          city: response.data.city,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to update city status",
        };
      }
    } catch (error) {
      console.error("Error updating city status:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error updating city status",
      };
    }
  }

  /**
   * Admin: Fetch pending location requests
   */
  static async fetchPendingRequests() {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/location-requests`, {
        withCredentials: true,
      });

      if (response.data.success) {
        return {
          success: true,
          vendors: response.data.vendors || [],
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to load pending requests",
        };
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error loading pending requests",
      };
    }
  }

  /**
   * Admin: Approve vendor with location resolution
   */
  static async approveVendor(vendorId, state, city, createLocation = false) {
    try {
      const response = await axios.patch(
        `${baseUrl}/admin/vendors/approve?vendorId=${vendorId}`,
        { state: state.trim(), city: city.trim(), createLocation },
        { withCredentials: true }
      );

      if (response.data.success) {
        return {
          success: true,
          vendor: response.data.vendor,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to approve vendor",
        };
      }
    } catch (error) {
      console.error("Error approving vendor:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error approving vendor",
      };
    }
  }

  /**
   * Helper: Find state and city names from IDs (enhanced for legacy support)
   */
  static findLocationNames(locations, stateId, cityId) {
    const selectedLocation = locations.find(loc =>
      loc.stateId === stateId || (stateId === null && loc.state)
    );
    if (!selectedLocation) return { stateName: '', cityName: '' };

    const selectedCity = selectedLocation.cities.find(city =>
      city.cityId === cityId || (cityId === null && city.name)
    );

    return {
      stateName: selectedLocation.state,
      cityName: selectedCity?.name || '',
    };
  }

  /**
   * Helper: Validate location selection (enhanced for legacy support)
   */
  static validateLocationSelection(stateId, cityId, addressLine, isLegacyMode = false) {
    const errors = [];

    if (!stateId) errors.push('Please select a state');
    if (!cityId) errors.push('Please select a city');
    if (!addressLine?.trim()) errors.push('Please enter your address');

    return {
      isValid: errors.length === 0,
      errors,
      isLegacyMode,
    };
  }
}

/**
 * React Hook for location management with enhanced features
 */
export const useLocationService = () => {
  return {
    fetchUserLocations: LocationService.fetchUserLocations,
    fetchStates: LocationService.fetchStates,
    createState: LocationService.createState,
    toggleStateStatus: LocationService.toggleStateStatus,
    fetchCities: LocationService.fetchCities,
    createCity: LocationService.createCity,
    toggleCityStatus: LocationService.toggleCityStatus,
    fetchPendingRequests: LocationService.fetchPendingRequests,
    approveVendor: LocationService.approveVendor,
    findLocationNames: LocationService.findLocationNames,
    validateLocationSelection: LocationService.validateLocationSelection,
  };
};

export default LocationService;
