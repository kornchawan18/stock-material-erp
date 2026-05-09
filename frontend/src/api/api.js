import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'
const api = axios.create({ baseURL: BASE })

export const getDashboard = () => api.get('/dashboard')

export const getMaterials = (params) => api.get('/materials', { params })
export const getMaterialFilters = () => api.get('/materials/filters')
export const getMaterial = (id) => api.get(`/materials/${id}`)
export const createMaterial = (data) => api.post('/materials', data)
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data)
export const deleteMaterial = (id) => api.delete(`/materials/${id}`)

export const getTransactions = (params) => api.get('/transactions', { params })
export const receiveStock = (data) => api.post('/transactions/receive', data)
export const issueStock = (data) => api.post('/transactions/issue', data)
export const adjustStock = (data) => api.post('/transactions/adjust', data)
