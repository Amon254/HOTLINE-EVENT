import apiClient from './client';

export const messagingAPI = {
  // Get all conversations for current user
  getConversations: () => apiClient.get('/messaging/'),

  // Start or get existing conversation with a venue
  startConversation: (venueId, firstMessage = '') =>
    apiClient.post('/messaging/', { venue: venueId, message: firstMessage }),

  // Get messages in a conversation (also marks as read)
  getMessages: (conversationId) =>
    apiClient.get(`/messaging/${conversationId}/messages/`),

  // Send a message
  sendMessage: (conversationId, body) =>
    apiClient.post(`/messaging/${conversationId}/send/`, { body }),

  // Get total unread count
  getUnreadCount: () => apiClient.get('/messaging/unread_count/'),
};