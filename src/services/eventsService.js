/**
 * Events Service with Multi-Tenancy Support
 * Handles API calls for events with organization-based filtering
 */

const API_BASE_URL = 'http://127.0.0.1:8001';

/**
 * Get events with organization filtering
 * @param {Object} options - Query options
 * @param {string} options.organizationId - Optional organization ID filter (Smart Guard only)
 * @param {number} options.skip - Number of events to skip
 * @param {number} options.limit - Maximum number of events to return
 * @returns {Promise<Array>} List of events
 */
export const getEvents = async (options = {}) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    
    // Add pagination
    if (options.skip) params.append('skip', options.skip.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    
    // Add organization filter - ONLY Smart Guard can filter by organization
    if (currentUser.email === 'admin@smartguard.com' && options.organizationId && options.organizationId !== 'all') {
      params.append('organization_id', options.organizationId);
    }
    
    // Add auth token
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/events?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Create a new event with automatic organization assignment
 * @param {Object} eventData - Event data to create
 * @returns {Promise<Object>} Created event
 */
export const createEvent = async (eventData) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Get a specific event by ID with organization access check
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event data
 */
export const getEventById = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied: You can only access events from your organization');
      } else if (response.status === 404) {
        throw new Error('Event not found');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<Object>} User data
 */
const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    // You might want to decode the JWT token or call a user endpoint
    // For now, return stored user data
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Export events to different formats with organization filtering
 * @param {string} format - Export format (csv, xlsx, json)
 * @param {string} organizationId - Optional organization filter (Smart Guard only)
 * @returns {Promise<Blob>} Downloadable file blob
 */
export const exportEvents = async (format = 'csv', organizationId = null) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    params.append('format', format);
    
    // Add organization filter - ONLY Smart Guard can filter by organization
    if (currentUser.email === 'admin@smartguard.com' && organizationId && organizationId !== 'all') {
      params.append('organization_id', organizationId);
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/events/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error exporting events:', error);
    throw error;
  }
};
