import apiClient from './client';

export const SPACE_KINDS = [
  { value: 'salle', label: 'Salle de réception' },
  { value: 'jardin', label: 'Jardin' },
  { value: 'terrasse', label: 'Terrasse / Rooftop' },
  { value: 'conference', label: 'Salle de conférence' },
  { value: 'vip', label: 'Salon VIP' },
  { value: 'piscine', label: 'Espace piscine' },
  { value: 'autre', label: 'Autre' },
];

// Les clés doivent correspondre à SPACE_AMENITY_KEYS du backend (spaces/models.py)
export const SPACE_AMENITIES = [
  { key: 'climatisation', label: 'Climatisation' },
  { key: 'sonorisation', label: 'Sonorisation' },
  { key: 'videoprojecteur', label: 'Vidéoprojecteur' },
  { key: 'scene', label: 'Scène' },
  { key: 'piste_danse', label: 'Piste de danse' },
  { key: 'cuisine_traiteur', label: 'Cuisine / office traiteur' },
  { key: 'vestiaire', label: 'Vestiaire' },
  { key: 'eclairage', label: 'Éclairage scénique' },
  { key: 'toilettes', label: 'Toilettes dédiées' },
  { key: 'espace_vip', label: 'Espace VIP' },
  { key: 'acces_pmr', label: 'Accès PMR' },
  { key: 'groupe_electrogene', label: 'Groupe électrogène' },
  { key: 'wifi', label: 'Wifi' },
  { key: 'parking', label: 'Parking' },
  { key: 'securite', label: 'Sécurité' },
];

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const spaceAPI = {
  list: (venueId) => apiClient.get('/spaces/', { params: { venue: venueId } }),
  listBySlug: (slug) => apiClient.get('/spaces/', { params: { venue_slug: slug } }),
  create: (data) => apiClient.post('/spaces/', data),
  update: (id, data) => apiClient.patch(`/spaces/${id}/`, data),
  remove: (id) => apiClient.delete(`/spaces/${id}/`),
  uploadImage: (id, formData) => apiClient.post(`/spaces/${id}/upload_image/`, formData, multipart),
  deleteImage: (id, imageId) => apiClient.delete(`/spaces/${id}/images/${imageId}/`),
};