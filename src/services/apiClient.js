import AsyncStorage from '@react-native-async-storage/async-storage';

// Local Wi-Fi network IP of the host computer, permitting physical devices running Expo Go to connect to the backend server.
export const API_URL = 'http://192.168.29.154:5000/api';

/**
 * Reusable fetch wrapper that handles auth headers and error formatting
 * @param {string} endpoint - API path (e.g., 'auth/login')
 * @param {Object} [options] - fetch options
 * @param {string} [tokenOverride] - option to override bearer token
 * @returns {Promise<any>} Response body JSON
 */
export async function request(endpoint, options = {}, tokenOverride = null) {
  const url = `${API_URL}/${endpoint}`;
  
  // Clone options and initialize headers
  const config = { ...options };
  config.headers = config.headers ? { ...config.headers } : {};

  // Retrieve token from storage if not overridden
  const token = tokenOverride || await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Set default Content-Type for JSON payloads (skip for FormData uploads)
  if (!(config.body instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  // Add timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = result.message || `API Error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`Request to ${endpoint} timed out`);
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    console.error(`Request to ${endpoint} failed:`, error);
    throw error;
  }
}
