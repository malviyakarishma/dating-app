import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_HOST = 'http://192.168.29.154:5000'; // Matches backend IP and port

let socket = null;
const eventListeners = new Map();

/**
 * Initialize Socket.IO connection
 */
export const initSocket = async () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    console.log('[Socket] Cannot connect, auth token missing');
    return null;
  }

  console.log('[Socket] Initializing connection to', SOCKET_HOST);
  
  socket = io(SOCKET_HOST, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected successfully with ID:', socket.id);
    
    // Restore any active listeners registered in memory
    eventListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        socket.on(event, callback);
      });
    });
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
};

/**
 * Disconnect socket session
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('[Socket] Disconnecting session...');
    socket.disconnect();
    socket = null;
  }
};

/**
 * Register global socket event listener
 */
export const on = (event, callback) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event).add(callback);

  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Unregister socket event listener
 */
export const off = (event, callback) => {
  if (eventListeners.has(event)) {
    eventListeners.get(event).delete(callback);
  }
  
  if (socket) {
    socket.off(event, callback);
  }
};

/**
 * Emit socket event
 */
export const emit = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`[Socket] Cannot emit '${event}' - socket not connected`);
  }
};

/**
 * Retrieve active socket instance
 */
export const getSocket = () => socket;
