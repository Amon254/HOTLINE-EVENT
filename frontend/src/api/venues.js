import apiClient from './client';

export const venueAPI = {
  getAll:       (params) => apiClient.get('/venues/', { params }),
  getOne:       (slug)   => apiClient.get(`/venues/${slug}/`),
  create:       (data)   => apiClient.post('/venues/', data),
  update:       (slug, data) => apiClient.patch(`/venues/${slug}/`, data),
  delete:       (slug)   => apiClient.delete(`/venues/${slug}/`),
  getFeatured:  ()       => apiClient.get('/venues/featured/'),
  getMyVenues:  ()       => apiClient.get('/venues/my_venues/'),
  getCategories: ()      => apiClient.get('/venues/categories/list/'),

  uploadImage: (slug, formData) =>
    apiClient.post(`/venues/${slug}/upload_image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadVideo: (slug, formData) =>
    apiClient.post(`/venues/${slug}/upload_video/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const reservationAPI = {
  getAll:       ()       => apiClient.get('/reservations/'),
  create:       (data)   => apiClient.post('/reservations/', data),
  updateStatus: (id, data) => apiClient.patch(`/reservations/${id}/update_status/`, data),
};

export const reviewAPI = {
  getForVenue: (venueId) => apiClient.get(`/reviews/?venue=${venueId}`),
  create:      (data)    => apiClient.post('/reviews/', data),
  delete:      (id)      => apiClient.delete(`/reviews/${id}/`),
};

export const authAPI = {
  login:    (creds) => apiClient.post('/token/', creds),
  register: (data)  => apiClient.post('/auth/register/', data),
  getMe:    ()      => apiClient.get('/auth/me/'),
  updateMe: (data)  => apiClient.patch('/auth/me/', data),
};