/**
 * Authentication Service
 * Handles user authentication with Supabase
 */

import { supabaseClient } from '../config/supabaseConfig.js';

const API_BASE_URL = 'http://127.0.0.1:8001';

export const authService = {
  /**
   * Sign up new user
   * @param {Object} userData - User data (email, password, name, role)
   * @returns {Promise<Object>} User data and token
   */
  signup: async (userData) => {
    try {
      console.log('🔄 Starting signup process for:', userData.email);
      
      // Always use backend API for secure password hashing and storage
      const backendResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          full_name: userData.name,
          role: userData.role,
          organization: userData.organization || '',
        })
      });
      
      const data = await backendResponse.json();
      console.log('✅ Backend response:', data);
      
      if (!backendResponse.ok) {
        throw new Error(data.detail || data.message || 'فشل عملية التسجيل');
      }
      
      return data;
      
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  signin: async (email, password) => {
    try {
      console.log('🔄 Starting signin process for:', email);
      
      const { supabaseClient } = await import('../config/supabaseConfig.js');
      
      // Always use backend API for secure password verification
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Pass the specific error message from the backend, or fallback to 'Login failed'
        throw new Error(data.detail || data.message || 'بريد إلكتروني أو كلمة مرور غير صحيحة');
      }
      
      // Store token
      if (data.token) {
        supabaseClient.setToken(data.token);
      }
      
      // Store user to local cache ONLY
      // User should already be in Supabase from signup/approval process
      if (data.user) {
        supabaseClient.setLocalUser(data.user);
      }
      
      return data;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  },

  /**
   * Sign out user
   */
  signout: () => {
    supabaseClient.removeToken();
    supabaseClient.removeUser();
  },

  /**
   * Get current user
   * @returns {Promise<Object|null>} Current user or null
   */
  getCurrentUser: async () => {
    return await supabaseClient.getUserAsync();
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if user is authenticated
   */
  isAuthenticated: async () => {
    const token = supabaseClient.getToken();
    if (!token) return false;
    const user = await supabaseClient.getUserAsync();
    return !!user;
  },

  /**
   * Get all users (admin only)
   * @returns {Promise<Array>} List of users
   */
  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.getToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to fetch users');
      }
      
      return data.users || [];
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  /**
   * Get pending signup requests (admin only)
   * @returns {Promise<Array>} List of pending signup requests
   */
  getPendingSignups: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.getToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to fetch requests');
      }
      
      return data.requests || [];
    } catch (error) {
      console.error('Get pending signups error:', error);
      throw error;
    }
  },

  /**
   * Get organization users directly from Supabase
   * @param {string} organization - Organization name
   * @returns {Promise<Array>} List of users in the organization from Supabase
   */
  getOrganizationUsersFromSupabase: async (organization) => {
    try {
      // Add cache-busting with timestamp
      const timestamp = Date.now();
      console.log(`🔄 Fetching fresh data for ${organization} at ${new Date(timestamp).toISOString()}`);
      
      const response = await supabaseClient
        .from('users')
        .select('*')
        .eq('organization', organization)
        .eq('role', 'security_man')
        .eq('status', 'approved');
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      console.log(`✅ Fresh data received: ${response.data?.length || 0} users`);
      return response.data || [];
    } catch (error) {
      console.error('Get organization users from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Get users by organization
   * @param {string} organization - Organization name
   * @returns {Promise<Array>} List of users in the organization
   */
  getOrganizationUsers: async (organization) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/organization-users?organization=${encodeURIComponent(organization)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.getToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to fetch organization users');
      }
      
      return data.users || [];
    } catch (error) {
      console.error('Get organization users error:', error);
      throw error;
    }
  },

  /**
   * Approve signup request (admin only)
   * @param {string} requestId - Request ID to approve
   * @returns {Promise<Object>} Updated request
   */
  approveSignup: async (requestId, email = null) => {
    try {
      const url = email 
        ? `${API_BASE_URL}/auth/signup-requests/${requestId}/approve?email=${encodeURIComponent(email)}`
        : `${API_BASE_URL}/auth/signup-requests/${requestId}/approve`;
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.getToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to approve request');
      }
      
      return data;
    } catch (error) {
      console.error('Approve signup error:', error);
      throw error;
    }
  },

  /**
   * Decline signup request (admin only)
   * @param {string} requestId - Request ID to decline
   * @param {string} reason - Reason for declining
   * @returns {Promise<Object>} Updated request
   */
  declineSignup: async (requestId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup-requests/${requestId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.getToken()}`
        },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to decline request');
      }
      
      return data;
    } catch (error) {
      console.error('Decline signup error:', error);
      throw error;
    }
  },

  /**
   * Update user details (admin only)
   * @param {string} userId - User ID to update
   * @param {Object} userData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.getToken()}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to update user');
      }
      
      return data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  /**
   * Delete user (admin only)
   * @param {string} userId - User ID to delete
   * @returns {Promise<Object>} Response from backend
   */
  deleteUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.getToken()}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // FastAPI returns errors in 'detail' field
        throw new Error(data.detail || data.message || 'فشل حذف المستخدم');
      }
      
      return data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }
};

export default authService;
