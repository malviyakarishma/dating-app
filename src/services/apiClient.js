import AsyncStorage from '@react-native-async-storage/async-storage';

// Local Wi-Fi network IP of the host computer, permitting physical devices running Expo Go to connect to the backend server.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.154:5000/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
      if (response.status === 401) {
        // If the unauthorized request is the refresh call itself, do not retry
        if (endpoint === 'auth/refresh') {
          if (unauthorizedHandler) {
            unauthorizedHandler();
          }
          const errorMessage = result.message || `API Error: ${response.status}`;
          throw new Error(errorMessage);
        }

        if (isRefreshing) {
          // Wait for the token to be refreshed by the existing process
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(async (newToken) => {
              config.headers['Authorization'] = `Bearer ${newToken}`;
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);
              config.signal = retryController.signal;

              const retryRes = await fetch(url, config);
              clearTimeout(retryTimeoutId);
              const retryResult = await retryRes.json().catch(() => ({}));
              if (!retryRes.ok) {
                throw new Error(retryResult.message || `API Error: ${retryRes.status}`);
              }
              return retryResult;
            });
        }

        isRefreshing = true;

        try {
          const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
          if (!storedRefreshToken) {
            throw new Error('No refresh token available');
          }

          const refreshUrl = `${API_URL}/auth/refresh`;
          const refreshRes = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          });

          if (!refreshRes.ok) {
            throw new Error('Refresh token expired or invalid');
          }

          const refreshResult = await refreshRes.json();
          const newAccessToken = refreshResult.data.tokens.access.token;
          const newRefreshToken = refreshResult.data.tokens.refresh.token;

          await AsyncStorage.setItem('userToken', newAccessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          processQueue(null, newAccessToken);
          isRefreshing = false;

          // Retry the original request
          config.headers['Authorization'] = `Bearer ${newAccessToken}`;
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);
          config.signal = retryController.signal;

          const retryRes = await fetch(url, config);
          clearTimeout(retryTimeoutId);
          const retryResult = await retryRes.json().catch(() => ({}));
          if (!retryRes.ok) {
            throw new Error(retryResult.message || `API Error: ${retryRes.status}`);
          }
          return retryResult;
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          if (unauthorizedHandler) {
            unauthorizedHandler();
          }
          throw refreshError;
        }
      }

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

let unauthorizedHandler = null;
export function onUnauthorized(callback) {
  unauthorizedHandler = callback;
}
