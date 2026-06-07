const User = require('../models/User');

/**
 * Helper to fetch data from Google APIs or fallback to mock data
 */
const getApiKey = () => process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * @desc    Get Google Maps configuration (API Key)
 * @route   GET /api/maps/config
 * @access  Private
 */
exports.getMapsConfig = async (req, res) => {
  try {
    const key = getApiKey();
    res.status(200).json({
      success: true,
      apiKey: key,
      hasKey: !!key
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Search addresses/places using Google Places Autocomplete Proxy
 * @route   GET /api/maps/autocomplete
 * @access  Private
 */
exports.autocompleteAddress = async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) {
      return res.status(400).json({ success: false, message: 'Input query is required' });
    }

    const key = getApiKey();
    if (!key) {
      // Mock places fallback for development without API key
      const mockPlaces = [
        { description: 'Connaught Place, New Delhi, Delhi, India', place_id: 'mock_cp' },
        { description: 'Green Park, New Delhi, Delhi, India', place_id: 'mock_gp' },
        { description: 'Vasant Kunj, New Delhi, Delhi, India', place_id: 'mock_vk' },
        { description: 'Rajendra Nagar, New Delhi, Delhi, India', place_id: 'mock_rn' },
        { description: 'Karol Bagh, New Delhi, Delhi, India', place_id: 'mock_kb' }
      ].filter(p => p.description.toLowerCase().includes(input.toLowerCase()));

      return res.status(200).json({ success: true, predictions: mockPlaces });
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${key}&components=country:in`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(400).json({ success: false, message: data.error_message || data.status });
    }

    res.status(200).json({ success: true, predictions: data.predictions || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Resolve address coordinates (Geocode) or update current user's live position
 * @route   POST /api/maps/location
 * @access  Private
 */
exports.resolveLocation = async (req, res) => {
  try {
    const { address, latitude, longitude, updateProfile } = req.body;

    // Mode A: Geocode address to coordinates
    if (address && !latitude && !longitude) {
      const key = getApiKey();
      if (!key) {
        // Return mock coordinates based on some known keywords
        let lat = 28.6139;
        let lng = 77.2090;
        if (address.toLowerCase().includes('connaught')) {
          lat = 28.6304; lng = 77.2177;
        } else if (address.toLowerCase().includes('green park')) {
          lat = 28.5588; lng = 77.2028;
        } else if (address.toLowerCase().includes('vasant kunj')) {
          lat = 28.5292; lng = 77.1542;
        } else if (address.toLowerCase().includes('karol bagh')) {
          lat = 28.6449; lng = 77.1878;
        }

        return res.status(200).json({
          success: true,
          address,
          latitude: lat,
          longitude: lng
        });
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        return res.status(400).json({ success: false, message: data.error_message || data.status });
      }

      const result = data.results[0];
      const { lat, lng } = result.geometry.location;

      return res.status(200).json({
        success: true,
        address: result.formatted_address,
        latitude: lat,
        longitude: lng
      });
    }

    // Mode B: Update User Profile Location coordinates
    if (latitude && longitude && updateProfile) {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          // Store inside nested structure if needed, or flat fields
        },
        { new: true }
      );
      return res.status(200).json({ success: true, data: user });
    }

    res.status(400).json({ success: false, message: 'Invalid location parameters provided' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get directions between two locations (Proxy directions)
 * @route   GET /api/maps/directions
 * @access  Private
 */
exports.getDirections = async (req, res) => {
  try {
    const { origin, destination } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ success: false, message: 'Origin and destination parameters are required' });
    }

    const key = getApiKey();
    if (!key) {
      // Return beautiful mock directions for local testing
      const parsedOrigin = origin.split(',');
      const parsedDest = destination.split(',');
      const oLat = parseFloat(parsedOrigin[0]) || 28.6139;
      const oLng = parseFloat(parsedOrigin[1]) || 77.2090;
      const dLat = parseFloat(parsedDest[0]) || 28.6304;
      const dLng = parseFloat(parsedDest[1]) || 77.2177;

      // Create a straight-ish route path of points
      const mockRoutePoints = [
        { lat: oLat, lng: oLng },
        { lat: (oLat + dLat) / 2 + 0.002, lng: (oLng + dLng) / 2 - 0.002 },
        { lat: dLat, lng: dLng }
      ];

      return res.status(200).json({
        success: true,
        distance: '4.8 km',
        duration: '11 mins',
        overview_path: mockRoutePoints,
        steps: [
          { html_instructions: 'Head <b>north</b> on NGO Main Rd toward Station Ln', distance: '1.2 km', duration: '3 mins' },
          { html_instructions: 'Turn <b>right</b> onto Connaught Outer Ring Rd', distance: '2.5 km', duration: '6 mins' },
          { html_instructions: 'Turn <b>left</b>. Destination will be on your left', distance: '1.1 km', duration: '2 mins' }
        ]
      });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(400).json({ success: false, message: data.error_message || data.status });
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Decode polyline points or extract overview path
    // Google Maps JS API DirectionsRenderer can decode polylines automatically,
    // but returning raw steps or overview_path is very clean.
    // We can decode polyline to array of lat/lng on backend or send the polyline.
    // Let's send the polyline string AND decoded points to be super helpful.
    const steps = leg.steps.map(s => ({
      html_instructions: s.html_instructions,
      distance: s.distance.text,
      duration: s.duration.text
    }));

    // Simple polyline decoder
    const decodePolyline = (str) => {
      let index = 0, len = str.length;
      let lat = 0, lng = 0;
      const coordinates = [];
      while (index < len) {
        let b, shift = 0, result = 0;
        do {
          b = str.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
          b = str.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
      }
      return coordinates;
    };

    const points = decodePolyline(route.overview_polyline.points);

    res.status(200).json({
      success: true,
      distance: leg.distance.text,
      duration: leg.duration.text,
      overview_path: points,
      polyline: route.overview_polyline.points,
      steps
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
