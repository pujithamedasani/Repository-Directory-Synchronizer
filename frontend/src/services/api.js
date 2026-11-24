import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

// Directory APIs
export const getDirectoryContents = (path) => api.get('/directories/browse', { params: { path } })
export const setSourceDir = (path) => api.post('/directories/select-source', { path })
export const setDestDir = (path) => api.post('/directories/select-destination', { path })
export const getSourceDir = () => api.get('/directories/source')
export const getDestDir = () => api.get('/directories/destination')
export const scanDirectories = () => api.get('/directories/scan')
export const validatePath = (path) => api.post('/directories/validate', { path })
export const createDirectory = (path) => api.post('/directories/create', { path })
export const resetDemoDirs = () => api.post('/directories/reset-demo')

// Comparison APIs
export const compareDirectories = (options) => api.post('/comparison/compare', options)
export const getComparisonResult = () => api.get('/comparison/result')

// Sync APIs
export const startSync = (options) => api.post('/sync/start', options)
export const cancelSync = () => api.post('/sync/cancel')
export const getSyncStatus = () => api.get('/sync/status')
export const previewSync = (options) => api.post('/sync/preview', options)
export const getConflicts = () => api.get('/sync/conflicts')
export const resolveConflict = (filePath, resolution) => api.post('/sync/resolve-conflict', { file_path: filePath, resolution })

// Monitoring APIs
export const startMonitoring = (directory) => api.post('/monitoring/start', { directory })
export const stopMonitoring = (directory) => api.post('/monitoring/stop', { directory })
export const getMonitoringStatus = () => api.get('/monitoring/status')
export const getMonitoringEvents = (directory, limit = 100) => api.get('/monitoring/events', { params: { directory, limit } })

// History APIs
export const getHistory = (params) => api.get('/history/', { params })
export const getHistoryStats = () => api.get('/history/stats')
export const getSessionDetail = (id) => api.get(`/history/${id}`)
export const getSessionOperations = (id) => api.get(`/history/${id}/operations`)
export const deleteHistoryRecord = (id) => api.delete(`/history/${id}`)

// Settings APIs
export const getSettings = () => api.get('/settings/')
export const updateSettings = (settings) => api.put('/settings/', settings)
export const resetSettings = () => api.post('/settings/reset')

// Health
export const checkHealth = () => api.get('/health')

export default api
