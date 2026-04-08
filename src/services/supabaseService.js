/**
 * Supabase-Only Service
 * All data operations directly from Supabase
 */

import { supabaseClient } from '../config/supabaseConfig.js';
import { authService } from './authService.js';

export const supabaseService = {
  /**
   * Get all users directly from Supabase
   * @returns {Promise<Array>} List of all users
   */
  getAllUsers: async () => {
    try {
      console.log('🔄 Fetching all users from Supabase...');
      const response = await supabaseClient.request('/users?select=*&order=created_at.desc', 'GET');
      
      console.log(`✅ Retrieved ${response?.length || 0} users from Supabase`);
      return response || [];
    } catch (error) {
      console.error('Get all users from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Get only approved users directly from Supabase
   * @returns {Promise<Array>} List of approved users only
   */
  getApprovedUsers: async () => {
    try {
      console.log('🔄 Fetching approved users from Supabase...');
      const response = await supabaseClient.request('/users?status=eq.approved&select=*&order=created_at.desc', 'GET');
      
      console.log(`✅ Retrieved ${response?.length || 0} approved users from Supabase`);
      return response || [];
    } catch (error) {
      console.error('Get approved users from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Get organization users directly from Supabase
   * @param {string} organization - Organization name
   * @returns {Promise<Array>} List of users in the organization
   */
  getOrganizationUsers: async (organization) => {
    try {
      console.log(`🔄 Fetching users for organization: ${organization}`);
      const response = await supabaseClient.request(`/users?organization=eq.${encodeURIComponent(organization)}&order=created_at.desc`, 'GET');
      
      console.log(`✅ Retrieved ${response?.length || 0} users for ${organization}`);
      return response || [];
    } catch (error) {
      console.error('Get organization users from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Get organization security staff directly from Supabase
   * @param {string} organization - Organization name
   * @returns {Promise<Array>} List of security staff in the organization
   */
  getOrganizationSecurityStaff: async (organization) => {
    try {
      console.log(`🔄 Fetching security staff for organization: ${organization}`);
      const response = await supabaseClient.request(`/users?organization=eq.${encodeURIComponent(organization)}&role=eq.security_man&status=eq.approved&order=created_at.desc`, 'GET');
      
      console.log(`✅ Retrieved ${response?.length || 0} security staff for ${organization}`);
      return response || [];
    } catch (error) {
      console.error('Get organization security staff from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Get pending signup requests directly from Supabase
   * @returns {Promise<Array>} List of pending requests
   */
  getPendingRequests: async () => {
    try {
      console.log('🔄 Fetching pending requests from Supabase...');
      const response = await supabaseClient.request('/users?status=eq.pending&order=created_at.desc', 'GET');
      
      console.log(`✅ Retrieved ${response?.length || 0} pending requests from Supabase`);
      return response || [];
    } catch (error) {
      console.error('Get pending requests from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Get user statistics directly from Supabase
   * @returns {Promise<Object>} User statistics
   */
  getUserStatistics: async () => {
    try {
      console.log('🔄 Fetching user statistics from Supabase...');
      
      // Get all users
      const allUsers = await supabaseClient.request('/users?select=role,status,organization&order=created_at.desc', 'GET');
      
      if (!allUsers) {
        throw new Error('Failed to fetch users for statistics');
      }
      
      const stats = {
        total: allUsers?.length || 0,
        approved: allUsers?.filter(u => u.status === 'approved').length || 0,
        declined: allUsers?.filter(u => u.status === 'declined').length || 0,
        pending: allUsers?.filter(u => u.status === 'pending').length || 0,
        admins: allUsers?.filter(u => u.role === 'admin').length || 0,
        security: allUsers?.filter(u => u.role === 'security_man').length || 0,
        organizations: [...new Set(allUsers?.map(u => u.organization) || [])]
      };
      
      console.log('✅ User statistics from Supabase:', stats);
      return stats;
    } catch (error) {
      console.error('Get user statistics from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Update user status directly in Supabase
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated user
   */
  updateUserStatus: async (userId, status) => {
    try {
      console.log(`🔄 Updating user ${userId} status to ${status}`);
      const response = await supabaseClient.request(`/users?id=eq.${userId}`, 'PATCH', { status });
      
      if (!response || response.length === 0) {
        throw new Error('Failed to update user status');
      }
      
      console.log(`✅ User ${userId} status updated to ${status}`);
      return response[0];
    } catch (error) {
      console.error('Update user status from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Update user information directly in Supabase
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user
   */
  updateUser: async (userId, userData) => {
    try {
      console.log(`🔄 Updating user ${userId} with data:`, userData);
      const response = await supabaseClient.request(`/users?id=eq.${userId}`, 'PATCH', userData);
      
      if (!response || response.length === 0) {
        throw new Error('Failed to update user');
      }
      
      console.log(`✅ User ${userId} updated successfully`);
      return response[0];
    } catch (error) {
      console.error('Update user from Supabase error:', error);
      throw error;
    }
  },

  /**
   * Delete user from both local DB and Supabase via Backend API
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  deleteUser: async (userId) => {
    try {
      console.log(`🔄 Starting full deletion of user ${userId}`);
      
      // Call backend API which handles both databases
      await authService.deleteUser(userId);
      
      console.log(`✅ User ${userId} deleted from all databases`);
      return true;
    } catch (error) {
      console.error('Delete user sync error:', error);
      throw error;
    }
  },

  /**
   * Create user directly in Supabase
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  createUser: async (userData) => {
    try {
      console.log('🔄 Creating user in Supabase...');
      const response = await supabaseClient.request('/users', 'POST', userData);
      
      if (!response || response.length === 0) {
        throw new Error('Failed to create user');
      }
      
      console.log('✅ User created in Supabase:', response[0]);
      return response[0];
    } catch (error) {
      console.error('Create user in Supabase error:', error);
      throw error;
    }
  }
};
