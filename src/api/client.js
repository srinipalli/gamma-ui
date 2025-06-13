// src/api/client.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const logAPI = {
  
  getCombinedLogs: async (params = {}) => {
    // Filter out "All" values from params to maintain backward compatibility
    const filteredParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] && params[key] !== 'All' && params[key] !== '') {
        filteredParams[key] = params[key];
      }
    });
    
    const response = await apiClient.get('/api/combined_logs', { params: filteredParams });
    return response.data;
  },
  
  getLogAnalysis: async (logId) => {
    if (!logId) throw new Error("No log ID provided");
    
    try {
      console.log("Fetching analysis for log ID:", logId);
      const cleanLogId = String(logId).trim();
      const response = await apiClient.get(`/api/log_analysis/${cleanLogId}`);
      return response.data;
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      if (error.response?.status === 404) {
        throw new Error("No analysis found for this log");
      }
      throw error;
    }
  },

  getServerMetrics: async (environment = null, app_name = null) => {
    console.log("🔍 API CLIENT DEBUG - FUNCTION CALLED!");
    console.log("  Received environment:", environment);
    console.log("  Received app_name:", app_name);
    
    const params = {};
    
    // Only add parameters if they're not null, not empty, and not "All"
    if (environment && environment !== '' && environment !== 'All') {
      params.environment = environment;
      console.log("  ✅ Added environment to params");
    } else {
      console.log("  ❌ environment NOT added - value:", environment);
    }
    
    if (app_name && app_name !== '' && app_name !== 'All') {
      params.app_name = app_name;
      console.log("  ✅ Added app_name to params");
    } else {
      console.log("  ❌ app_name NOT added - value:", app_name);
    }
    
    console.log("  📦 Final params object:", params);
    
    const response = await apiClient.get('/api/server_metrics', { params });
    return response.data;
  },

  getEnvironments: async () => {
    const response = await apiClient.get('/api/environments');
    return response.data;
  },
  
  getApplications: async (environment = null) => {
    // Only add environment parameter if it's not null, not empty, and not "All"
    const params = {};
    if (environment && environment !== '' && environment !== 'All') {
      params.environment = environment;
    }
    const response = await apiClient.get('/api/applications', { params });
    return response.data;
  },
  
  getDashboardStats: async () => {
    const response = await apiClient.get('/api/dashboard_stats');
    return response.data;
  },

  // Chatbot endpoints
  sendChatMessage: async (message, context = {}) => {
    const response = await apiClient.post('/api/chat/message', {
      message,
      context,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },

  getChatHistory: async (limit = 50) => {
    const response = await apiClient.get('/api/chat/history', {
      params: { limit }
    });
    return response.data;
  },

  // Additional utility methods for better error handling and caching
  
  // Method to test API connection health
  testConnection: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.status === 200;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  },

  // Method to get filtered logs with enhanced error handling
  getFilteredLogs: async (filters = {}) => {
    try {
      const params = {};
      
      // Apply filters while excluding "All" values
      if (filters.environment && filters.environment !== 'All') {
        params.environment = filters.environment;
      }
      if (filters.app_name && filters.app_name !== 'All') {
        params.app_name = filters.app_name;
      }
      if (filters.level && filters.level !== 'All') {
        params.level = filters.level;
      }
      if (filters.start_date) {
        params.start_date = filters.start_date;
      }
      if (filters.end_date) {
        params.end_date = filters.end_date;
      }
      if (filters.limit) {
        params.limit = filters.limit;
      }
      
      const response = await apiClient.get('/api/combined_logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching filtered logs:', error);
      throw error;
    }
  },

  // Method to get aggregated metrics with proper filtering
  getAggregatedMetrics: async (environment = null, app_name = null, timeRange = '24h') => {
    try {
      const params = { time_range: timeRange };
      
      if (environment && environment !== 'All') {
        params.environment = environment;
      }
      if (app_name && app_name !== 'All') {
        params.app_name = app_name;
      }
      
      const response = await apiClient.get('/api/aggregated_metrics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching aggregated metrics:', error);
      throw error;
    }
  }
};

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('🚨 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('🚨 API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Handle common error scenarios
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - consider implementing authentication');
    } else if (error.response?.status === 404) {
      console.warn('Resource not found');
    } else if (error.response?.status >= 500) {
      console.error('Server error - backend may be down');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
