import axios from 'axios'

// Use environment variable for API base URL, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5056/api'

// Create an Axios instance with default settings;

const api = axios.create({
  baseURL: 'http://localhost:5056/api', // The base URL for all API requests
  headers: {
    'Content-Type': 'application/json', // Ensure data is sent as JSON
    'Accept': 'application/json' // Expect JSON responses
  },
  withCredentials: true // Allow sending cookies with each request (important for Laravel Sanctum)
})

// Request interceptor to include the authentication token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      // Add Authorization header if token exists
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error) // Handle request errors
)



export default api;
