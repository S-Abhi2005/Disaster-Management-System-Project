import axiosInstance from './axiosInstance';

export const ALERT_TYPES = ['warning', 'critical', 'info', 'evacuation'];
export const ALERT_TARGETS = ['all', 'citizen', 'volunteer'];

export const getAlerts = async ({ target, type, active } = {}) => {
  try {
    const response = await axiosInstance.get('/alerts/');
    let data = Array.isArray(response) ? response : (response.data || []);
    
    // Filter locally if backend doesn't support query parameters natively
    if (target) data = data.filter((a) => a.target === 'all' || a.target === target);
    if (type) data = data.filter((a) => a.type === type);
    if (active !== undefined) data = data.filter((a) => a.active === active);

    // Sort descending by timestamp/created_at
    return data.sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));
  } catch (error) {
    console.error('getAlerts error:', error);
    throw error;
  }
};

export const createAlert = async (payload) => {
  try {
    const response = await axiosInstance.post('/alerts/', payload);
    return response;
  } catch (error) {
    console.error('createAlert error:', error);
    throw error;
  }
};

export const markAlertRead = async (id) => {
  try {
    // API endpoint doesn't exist, mock success
    console.warn("markAlertRead not implemented in backend. Mocking success.");
    return { message: 'Marked as read.' };
  } catch (error) {
    console.error('markAlertRead error:', error);
    throw error;
  }
};

export const deactivateAlert = async (id) => {
  try {
    console.warn("deactivateAlert not implemented in backend. Mocking success.");
    return { id, active: false };
  } catch (error) {
    console.error('deactivateAlert error:', error);
    throw error;
  }
};

export const deleteAlert = async (id) => {
  try {
    console.warn("deleteAlert not implemented in backend. Mocking success.");
    return { message: 'Alert deleted.' };
  } catch (error) {
    console.error('deleteAlert error:', error);
    throw error;
  }
};

// Kept for notification hook backwards compatibility if unused in production
export const simulateIncomingAlert = () => {
  console.warn("simulateIncomingAlert should be replaced by real websocket pushes.");
  return null;
};
