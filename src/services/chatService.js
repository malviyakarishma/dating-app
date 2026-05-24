import { request } from './apiClient.js';

/**
 * Send direct message to matched user
 * @param {string} receiverId
 * @param {string} text
 * @returns {Promise<any>}
 */
export async function sendMessage(receiverId, text) {
  return request('chats/message', {
    method: 'POST',
    body: JSON.stringify({ receiverId, text }),
  });
}

/**
 * Get direct message history logs
 * @param {string} otherUserId
 * @returns {Promise<any>}
 */
export async function getMessages(otherUserId) {
  return request(`chats/history/${otherUserId}`, {
    method: 'GET',
  });
}

/**
 * Get conversations listing with latest message
 * @returns {Promise<any>}
 */
export async function getConversations() {
  return request('chats/conversations', {
    method: 'GET',
  });
}
