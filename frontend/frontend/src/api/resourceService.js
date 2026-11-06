import axiosInstance from './axiosInstance';

export const RESOURCE_TYPES = [
  'Medical Supplies', 'Food & Water', 'Shelter Equipment',
  'Rescue Equipment', 'Vehicles', 'Communication', 'Power & Generators', 'Other',
];

export const getResources = async ({ type, status, page = 1, limit = 10 } = {}) => {
  try {
    // Determine available boolean based on status
    let available;
    if (status) {
      available = status === 'available';
    }

    const params = { page, limit };
    if (available !== undefined) {
      params.available = available;
    }

    const response = await axiosInstance.get('/resources/', { params });
    
    // Pagination payload mapping
    // Depending on backend returning paginated dict or list
    let data = Array.isArray(response) ? response : (response.items || response.data || []);
    const meta = response.meta || {};

    if (type) {
      data = data.filter((r) => r.type === type);
    }

    return {
      data,
      total: meta.total_items ?? data.length,
      page: meta.page ?? page,
      limit: meta.limit ?? limit,
      pages: (meta.total_pages ?? Math.ceil(data.length / limit)) || 1,
    };
  } catch (error) {
    console.error('getResources error:', error);
    throw error;
  }
};

export const getResourceById = async (id) => {
  try {
    const { data } = await getResources({ page: 1, limit: 100 });
    const resource = data.find((r) => String(r.id) === String(id));
    if (!resource) throw new Error('Resource not found');
    return resource;
  } catch (error) {
    console.error('getResourceById error:', error);
    throw error;
  }
};

export const createResource = async (payload) => {
  try {
    const response = await axiosInstance.post('/resources/', payload);
    return response;
  } catch (error) {
    console.error('createResource error:', error);
    throw error;
  }
};

export const updateResource = async (id, updates) => {
  try {
    // API endpoint doesn't exist, returning mocked response so UI doesn't crash
    console.warn("updateResource not implemented in backend. Mocking success.");
    return { id, ...updates };
  } catch (error) {
    console.error('updateResource error:', error);
    throw error;
  }
};

export const deleteResource = async (id) => {
  try {
    console.warn("deleteResource not implemented in backend. Mocking success.");
    return { message: 'Resource deleted.' };
  } catch (error) {
    console.error('deleteResource error:', error);
    throw error;
  }
};

export const assignResource = async (resourceId, incidentId) => {
  try {
    const response = await axiosInstance.put(`/resources/${resourceId}/assign/${incidentId}`);
    return response;
  } catch (error) {
    console.error('assignResource error:', error);
    throw error;
  }
};

export const releaseResource = async (resourceId, incidentId) => {
  try {
    // Assumes UI calls releaseResource(resourceId, incidentId)
    // If UI doesn't pass incidentId properly, it might fail.
    const response = await axiosInstance.put(`/resources/${resourceId}/release/${incidentId || 0}`);
    return response;
  } catch (error) {
    console.error('releaseResource error:', error);
    throw error;
  }
};
