import { request } from './apiClient.js';

/**
 * Create a Stripe Checkout Session to unlock chat with a matched user.
 *
 * @param {string} matchedUserId - The ID of the matched user to unlock chat with
 * @param {'ONE_TIME'|'SUBSCRIPTION'} paymentType - Payment plan type
 * @returns {Promise<{ checkoutUrl: string, sessionId: string }>}
 */
export async function unlockChat(matchedUserId, paymentType) {
  return request('chat/unlock', {
    method: 'POST',
    body: JSON.stringify({ matchedUserId, paymentType }),
  });
}

/**
 * Get chat access status for a specific match.
 *
 * @param {string} matchedUserId - The ID of the matched user
 * @returns {Promise<{ hasAccess: boolean, expiryDate: string|null, remainingTime: number|null, accessType: string|null, status: string|null }>}
 */
export async function getChatAccess(matchedUserId) {
  return request(`chat/access/${matchedUserId}`, {
    method: 'GET',
  });
}
