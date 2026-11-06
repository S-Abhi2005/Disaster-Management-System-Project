import axios from 'axios';

import { reverseGeocode } from './geocodeService';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const normalizeRole = (role) => String(role || '').toLowerCase();

const fetchMe = async (accessToken) => {
  const res = await axios.get(`${apiBase}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.data;
};

export const loginUser = async ({ email, password }) => {
  const tokenRes = await axios.post(`${apiBase}/auth/login-json`, { email, password });
  const access_token = tokenRes.data?.access_token;
  if (!access_token) throw { response: { data: { message: 'Login failed.' } } };

  const me = await fetchMe(access_token);
  localStorage.setItem('access_token', access_token);
  return {
    ...me,
    role: normalizeRole(me?.role),
    access_token,
  };
};

export const registerCitizen = async (payload) => {
  try {
    const response = await axios.post(`${apiBase}/auth/register/citizen`, payload);
    const access_token = response.data?.access_token;
    if (!access_token) throw { response: { data: { message: 'Registration failed.' } } };

    const me = await fetchMe(access_token);
    localStorage.setItem('access_token', access_token);
    return {
      ...me,
      role: normalizeRole(me?.role),
      access_token,
    };
  } catch (error) {
    console.error('Register citizen error:', error);
    throw error;
  }
};

export const registerVolunteer = async (payload) => {
  try {
    const response = await axios.post(`${apiBase}/auth/register/volunteer`, payload);
    const access_token = response.data?.access_token;
    if (!access_token) throw { response: { data: { message: 'Registration failed.' } } };

    const me = await fetchMe(access_token);
    localStorage.setItem('access_token', access_token);
    return {
      ...me,
      role: normalizeRole(me?.role),
      access_token,
    };
  } catch (error) {
    console.error('Register volunteer error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const access_token = localStorage.getItem('access_token');
    if (!access_token) throw { response: { data: { message: 'No access token found.' } } };

    const me = await fetchMe(access_token);
    return {
      ...me,
      role: normalizeRole(me?.role),
    };
  } catch (error) {
    console.error('Current user request error:', error);
    throw error;
  }
};

export const requestPasswordReset = async ({ email }) => {
  try {
    const res = await axios.post(`${apiBase}/auth/forgot-password`, { email });
    return res.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const verifyOtp = async ({ email, otp }) => {
  throw { response: { data: { message: 'OTP verification is not implemented on backend.' } } };
};

export const resetPassword = async ({ reset_token, password }) => {
  try {
    const res = await axios.post(`${apiBase}/auth/reset-password`, { token: reset_token, new_password: password });
    return res.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    localStorage.removeItem('access_token');
    return { message: 'Logged out.' };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getMockGpsLocation = async () => {
  const position = await new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });

  const latitude = position?.coords?.latitude;
  const longitude = position?.coords?.longitude;

  const geo = await reverseGeocode(latitude, longitude);

  return {
    latitude,
    longitude,
    address: geo?.displayName || '',
  };
};
