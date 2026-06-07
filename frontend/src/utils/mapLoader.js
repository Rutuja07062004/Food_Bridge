import API from '../services/api';

let googleMapsPromise = null;

export const loadGoogleMaps = () => {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise(async (resolve, reject) => {
    try {
      let apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

      // Fetch from backend configuration if not available in client env
      if (!apiKey) {
        try {
          const res = await API.get('/maps/config');
          if (res.data?.success) {
            apiKey = res.data.apiKey;
          }
        } catch (err) {
          console.warn('Unable to retrieve maps API key from backend config:', err);
        }
      }

      // Inject the Google Maps script tag dynamically
      const script = document.createElement('script');
      // Force loading with places library for Places Autocomplete
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script finished loading but window.google.maps was not found.'));
        }
      };

      script.onerror = (err) => {
        reject(new Error('Failed to load Google Maps script tag.'));
      };

      document.head.appendChild(script);
    } catch (err) {
      reject(err);
    }
  });

  return googleMapsPromise;
};
