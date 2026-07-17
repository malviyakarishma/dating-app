import { request, API_URL } from './apiClient.js';

export async function getProfile(tokenOverride = null) {
  return request('users/profile', {
    method: 'GET',
  }, tokenOverride);
}

export async function updateProfile(profileData, tokenOverride = null) {
  return request('users/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  }, tokenOverride);
}

export async function deleteAccount(tokenOverride = null) {
  return request('users/profile', {
    method: 'DELETE',
  }, tokenOverride);
}

export async function deletePhoto(photoUrl, tokenOverride = null) {
  return request('users/photo', {
    method: 'DELETE',
    body: JSON.stringify({ photoUrl }),
  }, tokenOverride);
}

export async function getDiscovery(gender = null) {
  const query = gender ? `?gender=${gender}` : '';
  return request(`users/discover${query}`, {
    method: 'GET',
  });
}

export async function uploadProfilePhotos(photoUris, tokenOverride = null) {
  const formData = new FormData();
  
  photoUris.forEach((uri, index) => {
    const filename = uri.split('/').pop() || `photo${index}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('photos', {
      uri,
      name: filename,
      type,
    });
  });

  return request('users/upload', {
    method: 'POST',
    body: formData,
  }, tokenOverride);
}

export async function savePushToken(expoPushToken) {
  return request('users/push-token', {
    method: 'PATCH',
    body: JSON.stringify({ expoPushToken }),
  });
}
