import { request } from './apiClient.js';

/**
 * Register a swipe action (like sends a request, dislike skips)
 * @param {string} likedId - ID of user swiped on
 * @param {string} status - 'like' | 'dislike'
 * @returns {Promise<any>} { isMatch, matchedUser }
 */
export async function swipe(likedId, status) {
  return request('swipes', {
    method: 'POST',
    body: JSON.stringify({ likedId, status }),
  });
}

/**
 * Get all incoming pending like requests (people who liked you)
 * @returns {Promise<any>} { requests: [{ swipeId, user, createdAt }] }
 */
export async function getRequests() {
  return request('swipes/requests', {
    method: 'GET',
  });
}

/**
 * Accept or decline an incoming like request
 * @param {string} swipeId - ID of the swipe document
 * @param {'accept'|'decline'} action
 * @returns {Promise<any>}
 */
export async function respondToRequest(swipeId, action) {
  return request(`swipes/requests/${swipeId}`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

/**
 * Get all accepted mutual matches
 * @returns {Promise<any>} Matches list
 */
export async function getMatches() {
  return request('swipes/matches', {
    method: 'GET',
  });
}
