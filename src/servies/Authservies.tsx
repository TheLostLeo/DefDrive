import axios from 'axios';

// Replace with your actual backend URL
const API_URL = 'http://db.wlan0.in/api';

// Create axios instance with authorization header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  // Login user
  async login(username: string, password: string) {
    try {
      const response = await api.post('/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Register new user
  async register(username: string, email: string, password: string) {
    try {
      const response = await api.post('/signup', { 
        username, 
        email, 
        password 
      });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },


  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  // Logout user
  logout() {
    localStorage.removeItem('authToken');
  }
};