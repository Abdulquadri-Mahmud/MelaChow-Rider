"use client";

import { useState, useEffect } from "react";
import { ChevronDown, AlertCircle, MapPin, Navigation, Building2 } from "lucide-react";
import { LocationService } from "@/app/lib/locationService";
import toast from "react-hot-toast";

/**
 * Debug Information Component (Development Mode Only)
 */
/**
 * Location Skeleton Loader
 */
const LocationSkeleton = ({ className }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
    <div className="space-y-2">
      <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
      <div className="h-12 w-full bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
      <div className="h-12 w-full bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
    </div>
  </div>
);

/**
 * Enhanced Location Error State Component
 */
const LocationErrorState = ({ error, onRetry }) => (
  <div className="location-error bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 text-center">
    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
    <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">⚠️ Unable to Load Locations</h4>
    <p className="text-red-600 dark:text-red-500 text-sm mb-3">{error}</p>
    <button
      onClick={onRetry}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      Try Again
    </button>
  </div>
);

/**
 * Reusable Location Selector Component with Enhanced Error Handling & Fallback Strategy
 */
export default function LocationSelector({
  selectedStateId,
  selectedCityId,
  onStateChange,
  onCityChange,
  disabled = false,
  required = false,
  className = "",
  stateLabel = "State",
  cityLabel = "City",
  stateError = null,
  cityError = null,
}) {
  const [locations, setLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLegacyMode, setIsLegacyMode] = useState(false);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Update cities when state changes
  useEffect(() => {
    if (selectedStateId) {
      const selectedLocation = locations.find(loc =>
        loc.stateId === selectedStateId || (isLegacyMode && loc.state === selectedStateId)
      );
      setCities(selectedLocation?.cities || []);
    } else {
      setCities([]);
    }
  }, [selectedStateId, locations, isLegacyMode]);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await LocationService.fetchUserLocations();

      if (result.success) {
        setLocations(result.locations);
        setIsLegacyMode(result.isLegacyMode || false);

        // Removed legacy toast to keep UI clean
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Error in LocationSelector:", err);
      setError("Failed to load locations");
      toast.error("Failed to load locations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateChange = (e) => {
    const stateValue = e.target.value;

    // Find state name - handle both legacy and new formats
    let stateName = '';
    if (isLegacyMode) {
      stateName = stateValue; // In legacy mode, value is the state name
    } else {
      const selectedLocation = locations.find(loc => loc.stateId === stateValue);
      stateName = selectedLocation?.state || '';
    }

    // Call parent handlers
    onStateChange(stateValue, stateName);
  };

  const handleCityChange = (e) => {
    const cityValue = e.target.value;

    // Find city name - handle both legacy and new formats
    let cityName = '';
    if (isLegacyMode) {
      cityName = cityValue; // In legacy mode, value is the city name
    } else {
      const selectedCity = cities.find(city => city.cityId === cityValue);
      cityName = selectedCity?.name || '';
    }

    // Call parent handler
    onCityChange(cityValue, cityName);
  };

  if (isLoading) {
    return <LocationSkeleton className={className} />;
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LocationErrorState error={error} onRetry={fetchLocations} />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-lg p-6 text-center">
          <MapPin className="w-8 h-8 text-gray-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-slate-400 text-sm">No locations available at the moment.</p>
          <p className="text-gray-500 dark:text-slate-500 text-xs mt-1">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {stateLabel} {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
              <Navigation className="w-4 h-4" />
            </div>
            <select
              value={selectedStateId}
              onChange={handleStateChange}
              disabled={disabled}
              required={required}
              className={`w-full appearance-none rounded-lg border bg-white dark:bg-slate-800 py-3 pl-10 pr-10 text-sm text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed ${stateError
                ? 'border-red-300 dark:border-red-900 focus:border-red-500 focus:ring-red-500/10'
                : 'border-gray-300 dark:border-slate-700'
                }`}
            >
              <option value="">Select {stateLabel}</option>
              {locations.map((location, index) => (
                <option
                  key={isLegacyMode ? index : location.stateId}
                  value={isLegacyMode ? location.state : location.stateId}
                >
                  {location.state}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {stateError && (
            <p className="text-red-500 text-xs mt-1">{stateError}</p>
          )}
        </div>

        {/* City Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {cityLabel} {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              value={selectedCityId}
              onChange={handleCityChange}
              disabled={disabled || !selectedStateId}
              required={required}
              className={`w-full appearance-none rounded-lg border bg-white dark:bg-slate-800 py-3 pl-10 pr-10 text-sm text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed ${cityError
                ? 'border-red-300 dark:border-red-900 focus:border-red-500 focus:ring-red-500/10'
                : 'border-gray-300 dark:border-slate-700'
                }`}
            >
              <option value="">
                {!selectedStateId ? `Select ${stateLabel.toLowerCase()} first` : `Select ${cityLabel}`}
              </option>
              {cities.map((city, index) => (
                <option
                  key={isLegacyMode ? index : city.cityId}
                  value={isLegacyMode ? city.name : city.cityId}
                >
                  {city.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {cityError && (
            <p className="text-red-500 text-xs mt-1">{cityError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Enhanced Location Selector Hook with Legacy Support
 */
export const useLocationSelector = (initialStateId = "", initialCityId = "") => {
  const [selectedStateId, setSelectedStateId] = useState(initialStateId);
  const [selectedCityId, setSelectedCityId] = useState(initialCityId);
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [isLegacyMode, setIsLegacyMode] = useState(false);

  const handleStateChange = (stateId, name) => {
    setSelectedStateId(stateId);
    setStateName(name);
    // Reset city when state changes
    setSelectedCityId("");
    setCityName("");
  };

  const handleCityChange = (cityId, name) => {
    setSelectedCityId(cityId);
    setCityName(name);
  };

  const reset = () => {
    setSelectedStateId("");
    setSelectedCityId("");
    setStateName("");
    setCityName("");
  };

  const isValid = selectedStateId && selectedCityId;

  return {
    selectedStateId,
    selectedCityId,
    stateName,
    cityName,
    handleStateChange,
    handleCityChange,
    reset,
    isValid,
    isLegacyMode,
    setIsLegacyMode,
  };
};
