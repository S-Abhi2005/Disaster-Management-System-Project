import axiosInstance from './axiosInstance';

/**
 * Fetch list of all administrator accounts (Admins and Super Admins)
 */
export const getAdminAccounts = async () => {
  return await axiosInstance.get('/users/admins');
};

/**
 * Create a new administrator account (Super Admin only)
 */
export const createAdminAccount = async (payload) => {
  return await axiosInstance.post('/users/admins', payload);
};

/**
 * Activate or deactivate an administrator account (Super Admin only)
 */
export const updateAdminStatus = async (userId, isActive) => {
  return await axiosInstance.put(`/users/admins/${userId}/status`, { is_active: isActive });
};

/**
 * Update an administrator account details (Super Admin only)
 */
export const updateAdminAccount = async (userId, payload) => {
  return await axiosInstance.put(`/users/admins/${userId}`, payload);
};

/**
 * Delete an administrator account (Super Admin only)
 */
export const deleteAdminAccount = async (userId) => {
  return await axiosInstance.delete(`/users/admins/${userId}`);
};

