import axiosInstance from './axiosInstance';

const mapBackendStatusToUi = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'REPORTED' || s === 'VERIFIED') return 'pending';
  if (s === 'IN_PROGRESS') return 'active';
  if (s === 'RESOLVED') return 'resolved';
  if (s === 'ARCHIVED') return 'closed';
  return 'pending';
};

const mapUiStatusToBackend = (status) => {
  if (!status) return undefined;
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return 'REPORTED';
  if (s === 'active') return 'IN_PROGRESS';
  if (s === 'resolved') return 'RESOLVED';
  if (s === 'closed') return 'ARCHIVED';
  return undefined;
};

const mapIncidentFromBackend = (inc) => {
  const latitude = inc?.latitude ?? 0;
  const longitude = inc?.longitude ?? 0;

  return {
    id: String(inc?.id ?? ''),
    title: inc?.title ?? '',
    description: inc?.description ?? '',
    status: mapBackendStatusToUi(inc?.status),
    created_at: inc?.created_at,
    latitude,
    longitude,
    severity: inc?.severity || 'medium',
    type: inc?.type || 'Other',
    location: {
      lat: latitude,
      lng: longitude,
      address: `(${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)})`,
    },
    reported_by: { id: String(inc?.reported_by ?? ''), name: inc?.reported_by_name || '', role: '' },
    assigned_volunteer: null,
    images: [],
    updated_at: inc?.created_at,
    upvotes: 0,
    comments: 0,
  };
};

// ── GET ALL INCIDENTS ─────────────────────────────────────────────────────────
export const getIncidents = async ({ status, type, city, page = 1, limit = 10 } = {}) => {
  const res = await axiosInstance.get('/incidents/', {
    params: {
      status: mapUiStatusToBackend(status),
      page,
      limit: Math.min(limit, 100),
    },
  });

  const items = res?.items || [];
  const meta = res?.meta || {};
  let data = items.map(mapIncidentFromBackend);

  if (type) data = data.filter((i) => i.type === type);
  if (city) data = data.filter((i) => i.city?.toLowerCase().includes(city.toLowerCase()));

  return {
    data,
    total: meta.total_items ?? data.length,
    page: meta.page ?? page,
    limit: meta.limit ?? limit,
    pages: meta.total_pages ?? 1,
  };
};

// ── GET MY INCIDENTS (by user id) ─────────────────────────────────────────────
export const getMyIncidents = async (userId, { status, page = 1, limit = 10 } = {}) => {
  try {
    const res = await axiosInstance.get('/incidents/my', {
      params: {
        status: mapUiStatusToBackend(status),
        page,
        limit: Math.min(limit, 100),
      },
    });

    const items = res?.items || [];
    const meta = res?.meta || {};
    const data = items.map(mapIncidentFromBackend);

    return {
      data,
      total: meta.total_items ?? data.length,
      page: meta.page ?? page,
      limit: meta.limit ?? limit,
      pages: meta.total_pages ?? 1,
    };
  } catch (error) {
    console.error('getMyIncidents error:', error);
    throw error;
  }
};

// ── GET INCIDENT BY ID ────────────────────────────────────────────────────────
export const getIncidentById = async (id) => {
  const res = await axiosInstance.get(`/incidents/${id}`);
  const inc = mapIncidentFromBackend(res);

  try {
    const assignmentsRes = await axiosInstance.get(`/assignments/incident/${id}`);
    const assignments = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes?.data || []);
    
    const volunteerIds = new Set();
    for (const e of assignments) {
      if (e?.assignment_type === 'VOLUNTEER' && e?.action === 'ASSIGNED') {
        volunteerIds.add(e.subject_id);
      }
    }
    inc.assigned_volunteers_count = volunteerIds.size;
  } catch (err) {
    console.error("Failed to load assignment details for incident", err);
  }

  return inc;
};

// ── CREATE INCIDENT ───────────────────────────────────────────────────────────
export const createIncident = async (payload) => {
  const latitude = payload?.location?.lat ?? payload?.latitude;
  const longitude = payload?.location?.lng ?? payload?.longitude;

  const form = new FormData();
  form.append('title', payload?.title || '');
  form.append('description', payload?.description || '');
  form.append('latitude', String(latitude ?? ''));
  form.append('longitude', String(longitude ?? ''));
  form.append('type', payload?.type || 'Other');
  form.append('severity', payload?.severity || 'medium');

  const firstImageFile = payload?.images?.[0]?.file;
  if (firstImageFile instanceof File) {
    form.append('photo', firstImageFile);
  }

  const res = await axiosInstance.post('/incidents/', form, {
    headers: {
      'Content-Type': undefined,
    },
  });

  return mapIncidentFromBackend(res);
};

// ── UPDATE INCIDENT STATUS ────────────────────────────────────────────────────
export const updateIncidentStatus = async (id, status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') {
    const res = await axiosInstance.put(`/incidents/${id}/verify`);
    return res;
  }
  if (s === 'active') {
    const res = await axiosInstance.put(`/incidents/${id}/start`);
    return res;
  }
  if (s === 'resolved') {
    const res = await axiosInstance.put(`/incidents/${id}/resolve`);
    return res;
  }
  if (s === 'closed') {
    const res = await axiosInstance.put(`/incidents/${id}/archive`);
    return res;
  }
  return { message: 'No status transition performed' };
};

export const deleteIncident = async (id) => {
  const res = await axiosInstance.delete(`/incidents/${id}`);
  return res;
};

// ── ASSIGN VOLUNTEER ──────────────────────────────────────────────────────────
export const assignVolunteerToIncident = async (incidentId, volunteer) => {
  const res = await axiosInstance.put(`/volunteers/${volunteer.id}/assign/${incidentId}`);
  return res;
};

// ── GET INCIDENT ASSIGNMENTS ──────────────────────────────────────────────────
export const getIncidentAssignments = async (incidentId) => {
  try {
    const res = await axiosInstance.get(`/assignments/incident/${incidentId}`);
    return Array.isArray(res) ? res : (res?.data || []);
  } catch (err) {
    // Return empty if assignments route blocks it or errors
    return [];
  }
};

// ── GET NEARBY INCIDENTS ──────────────────────────────────────────────────────
export const getNearbyIncidents = async (lat, lng, radiusKm = 10) => {
  const res = await axiosInstance.get('/incidents/nearby', {
    params: {
      lat,
      lng,
      radius_km: radiusKm,
    },
  });

  const items = Array.isArray(res) ? res : [];
  return items.map((i) => mapIncidentFromBackend(i));
};

// ── GET INCIDENT TYPES ────────────────────────────────────────────────────────
export const INCIDENT_TYPES = [
  'Flood', 'Cyclone', 'Earthquake', 'Fire', 'Landslide',
  'Structural Collapse', 'Medical Emergency', 'Hazardous Material',
  'Road Accident', 'Power Outage', 'Water Shortage', 'Other',
];

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];
