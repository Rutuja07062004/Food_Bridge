import API from './api';

const mapService = {
  /**
   * Search locations using Places Autocomplete Proxy
   */
  getAutocomplete: async (input) => {
    const response = await API.get('/maps/autocomplete', { params: { input } });
    return response.data;
  },

  /**
   * Fetch directions, route, and text steps between two coordinates/addresses
   */
  getDirections: async (origin, destination) => {
    const response = await API.get('/maps/directions', { params: { origin, destination } });
    return response.data;
  },

  /**
   * Geocode a text address into coordinates (latitude, longitude)
   */
  resolveLocation: async (address) => {
    const response = await API.post('/maps/location', { address });
    return response.data;
  },

  /**
   * Update current user's profile location coordinates
   */
  updateUserLocation: async (latitude, longitude) => {
    const response = await API.post('/maps/location', { latitude, longitude, updateProfile: true });
    return response.data;
  },

  /**
   * Fetch surplus food listings within a specific radius of coordinates
   */
  getNearbyFood: async ({ latitude, longitude, lat, lng, radius, sortBy, category }) => {
    const params = {
      latitude: latitude || lat,
      longitude: longitude || lng,
      radius,
      sortBy,
      category
    };
    const response = await API.get('/food/nearby', { params });
    return response.data;
  }
};

export default mapService;
