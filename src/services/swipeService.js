import { request } from './apiClient.js';

/**
 * Register a swipe action (like or dislike)
 * @param {string} likedId - ID of user swiped on
 * @param {string} status - 'like' | 'dislike'
 * @returns {Promise<any>} Response with match results { swipe, isMatch, matchedUser }
 */
export async function swipe(likedId, status) {
  return request('swipes', {
    method: 'POST',
    body: JSON.stringify({ likedId, status }),
  });
}

/**
 * Get all mutual matches
 * @returns {Promise<any>} Matches list
 */
export async function getMatches() {
  return request('swipes/matches', {
    method: 'GET',
  });
}
