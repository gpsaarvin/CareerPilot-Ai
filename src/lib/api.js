// ============================================================
// API Utility — Centralized fetch wrapper for backend calls
// ============================================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Generic fetch wrapper with auth support
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('careersync_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Network error: cannot reach API at ${API_BASE}. ` +
      `Make sure the backend is running and NEXT_PUBLIC_API_URL is correct.`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `API request failed (${response.status})`);
  }

  return data || {};
}

// ---- Auth API ----
export const authAPI = {
  signup: (body) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  google: (body) => apiFetch('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiFetch('/auth/me'),
  updateProfile: (body) => apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
};

// ---- Internship API ----
export const internshipAPI = {
  getAll: (params = '') => apiFetch(`/internships${params ? '?' + params : ''}`),
  companySearch: (company, params = '') =>
    apiFetch(`/internships/company-search?company=${encodeURIComponent(company)}${params ? '&' + params : ''}`),
  getById: (id) => apiFetch(`/internships/${id}`),
  getFilters: () => apiFetch('/internships/filters'),
  trackClick: (id) => apiFetch(`/internships/${id}/click`, { method: 'POST' }),
};

// ---- Application API ----
export const applicationAPI = {
  apply: (body) => apiFetch('/apply', { method: 'POST', body: JSON.stringify(body) }),
  getAll: (status = '') => apiFetch(`/applications${status ? '?status=' + status : ''}`),
  update: (id, body) => apiFetch(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => apiFetch(`/applications/${id}`, { method: 'DELETE' }),
};

// ---- Resume API ----
export const resumeAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('careersync_token') : '';
    const response = await fetch(`${API_BASE}/resume/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData, // Don't set Content-Type for FormData
    });
    return response.json();
  },
  analyze: () => apiFetch('/resume/analyze', { method: 'POST' }),
};

// ---- Recommendations API ----
export const recommendationAPI = {
  get: () => apiFetch('/recommendations'),
};

export const aiAPI = {
  getCompanyResumeSuggestions: (body) =>
    apiFetch('/ai-resume-suggestions', { method: 'POST', body: JSON.stringify(body) }),
};
