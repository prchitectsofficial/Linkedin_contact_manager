import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const contactsAPI = {
  getAll: (params) => api.get('/contacts', { params }),
  getStats: (params) => api.get('/contacts/stats', { params }),
  getOne: (table, id) => api.get(`/contacts/${table}/${id}`),
  update: (table, id, data) => api.put(`/contacts/${table}/${id}`, data),
  create: (data) => api.post('/contacts', data),
  upload: (formData) => api.post('/contacts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const brandsAPI = {
  create: (data) => api.post('/brands', data),
};

export default api;
