import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API_URL });
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

export const fetchDashboard = (params = {}) => api.get('/api/analytics/dashboard', { params, headers: getAuthHeaders() }).then(r => r.data);
export const fetchDaily = (params = {}) => api.get('/api/analytics/daily', { params, headers: getAuthHeaders() }).then(r => r.data);
export const fetchWeekly = (params = {}) => api.get('/api/analytics/weekly', { params, headers: getAuthHeaders() }).then(r => r.data);
export const fetchMonthly = (params = {}) => api.get('/api/analytics/monthly', { params, headers: getAuthHeaders() }).then(r => r.data);
export const fetchYearly = (params = {}) => api.get('/api/analytics/yearly', { params, headers: getAuthHeaders() }).then(r => r.data);
export const fetchUsers = (params = {}) => api.get('/api/analytics/users', { params, headers: getAuthHeaders() }).then(r => r.data);
export const fetchAuctions = (params = {}) => api.get('/api/analytics/auctions', { params, headers: getAuthHeaders() }).then(r => r.data);
export const fetchRevenue = (params = {}) => api.get('/api/analytics/revenue', { params, headers: getAuthHeaders() }).then(r => r.data);
export const fetchPerformance = (params = {}) => api.get('/api/analytics/performance', { params, headers: getAuthHeaders() }).then(r => r.data);

export default {
    fetchDashboard,
    fetchDaily,
    fetchWeekly,
    fetchMonthly,
    fetchYearly,
    fetchUsers,
    fetchAuctions,
    fetchRevenue,
    fetchPerformance,
};
