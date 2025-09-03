// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  message: string
  status: number
  statusText: string
}

// Custom error class
export class ApiException extends Error {
  status: number
  statusText: string

  constructor(message: string, status: number, statusText: string) {
    super(message)
    this.name = 'ApiException'
    this.status = status
    this.statusText = statusText
  }
}

// Request configuration
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

// Authentication now uses HTTP-only cookies, no token needed

// Base fetch wrapper with error handling
export const apiRequest = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 10000,
  } = config

  const url = `${API_BASE_URL}${endpoint}`
  
  // Default headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // We're using HTTP-only cookies for authentication, 
  // so we need to include credentials in the request
  const credentials: RequestCredentials = 'include';

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: defaultHeaders,
  }

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    if (body instanceof FormData) {
      // For FormData, remove Content-Type header to let browser set it
      delete defaultHeaders['Content-Type']
      requestOptions.body = body
    } else {
      requestOptions.body = JSON.stringify(body)
    }
  }

  // Add credentials to include cookies
  requestOptions.credentials = 'include'
  
  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  requestOptions.signal = controller.signal

  try {
    const response = await fetch(url, requestOptions)
    clearTimeout(timeoutId)

    // Check if response is ok
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // If error response is not JSON, use default message
      }

      throw new ApiException(errorMessage, response.status, response.statusText)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof ApiException) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiException('Request timeout', 408, 'Request Timeout')
      }
      throw new ApiException(error.message, 0, 'Network Error')
    }

    throw new ApiException('Unknown error occurred', 0, 'Unknown Error')
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'GET', headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'POST', body, headers }),

  put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, headers }),

  patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, headers }),

  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', headers }),
}

// Specific API endpoints for username-only auth
export const authApi = {
  login: (username: string) =>
    api.post('/auth/login', { username }),

  register: (username: string) =>
    api.post('/auth/register', { username }),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get('/auth/me'),
}

// Font detection API
export interface FontDetectionResult {
  success: boolean;
  category: string;
  suggestions: string[];
  confidence: number;
  fallback?: boolean;
}

export const fontApi = {
  detectFont: (file: File): Promise<FontDetectionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<FontDetectionResult>('/font-detect', formData);
  }
}

export const projectsApi = {
  getAll: () =>
    api.get('/projects'),

  getById: (id: string) =>
    api.get(`/projects/${id}`),

  create: (project: { name: string; description?: string }) =>
    api.post('/projects', project),

  update: (id: string, updates: { name?: string; description?: string; canvasData?: string }) =>
    api.put(`/projects/${id}`, updates),

  delete: (id: string) =>
    api.delete(`/projects/${id}`),

  saveCanvas: (id: string, canvasData: string) =>
    api.patch(`/projects/${id}/canvas`, { canvasData }),
}

// Element types
export interface Element {
  id: string;
  name: string;
  tags: string[];
  file_path: string;
  created_at: string;
}

export const elementsApi = {
  getAll: (search?: string) =>
    api.get<Element[]>('/elements' + (search ? `?search=${encodeURIComponent(search)}` : '')),
    
  getById: (id: string) =>
    api.get<Element>(`/elements/${id}`),
    
  create: (data: FormData) =>
    api.post<Element>('/elements', data),
    
  delete: (id: string) =>
    api.delete(`/elements/${id}`),
    
  getElementFileUrl: (id: string) =>
    `${API_BASE_URL}/elements/${id}/file`,
}

export const filesApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/files/upload', formData)
  },

  delete: (fileId: string) =>
    api.delete(`/files/${fileId}`),

  getUrl: (fileId: string) =>
    `${API_BASE_URL}/files/${fileId}`,
}

// Health check
export const healthCheck = () =>
  api.get('/health')

// Test endpoint
export const testConnection = () =>
  api.get('/api/test')

// Utility to handle API errors
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiException) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// We're using HTTP-only cookies for authentication now, 
// so we don't need to manage tokens in localStorage
