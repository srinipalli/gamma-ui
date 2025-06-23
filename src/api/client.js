import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const api = {
  // Dashboard Stats
  getDashboardStats: async (environment = "All", app_name = "All") => {
    try {
      const response = await apiClient.get("/dashboard_stats", {
        params: { environment, app_name },
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
      throw error
    }
  },

  // Performance Summary
  getPerformanceSummary: async (environment = "All", app_name = "All") => {
    try {
      const response = await apiClient.get("/performance_summary", {
        params: { environment, app_name },
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch performance summary:", error)
      throw error
    }
  },

  // Server Metrics
  getServerMetrics: async (environment = "All", app_name = "All") => {
    try {
      const response = await apiClient.get("/server_metrics", {
        params: { environment, app_name },
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch server metrics:", error)
      throw error
    }
  },

  // Network Metrics
  getNetworkMetrics: async (environment = "All", app_name = "All", page = 1, limit = 10, server = null) => {
    try {
      const params = new URLSearchParams()
      if (environment) params.append('environment', environment)
      if (app_name) params.append('app_name', app_name)
      if (server) params.append('server', server)
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const response = await apiClient.get(`/network-metrics?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch network metrics:", error)
      throw error
    }
  },


  // Application Logs
  getAppLogs: async (environment = "All", app_name = "All", filters = {}) => {
    try {
      const response = await apiClient.get("/app-logs", {
        params: { 
          environment, 
          app_name, // Fixed: was using 'app' instead of 'app_name'
          ...filters 
        },
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch app logs:", error)
      throw error
    }
  },

  // Environments and Applications
  getEnvironments: async () => {
    try {
      const response = await apiClient.get("/environments")
      const environments = response.data.environments
      
      return {
        environments: environments,
        defaultEnvironment: environments[0] // Auto-select first environment
      }
    } catch (error) {
      console.error("Failed to fetch environments:", error)
      return {
        environments: ["Development", "Staging", "Production", "QA"],
        defaultEnvironment: "Development"
      }
    }
  },

  getLLMAnalysis: async (original_log_id) => {
    try {
      const response = await apiClient.get(`/llm_analysis/${original_log_id}`)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("No LLM analysis found for this log")
        return null
      }
      console.error("Failed to fetch LLM analysis:", error)
      throw error
    }
  },

  getLogsWithAnalysis: async (environment = "All", app_name = "All", limit = 50) => {
    try {
      const response = await apiClient.get("/logs_with_analysis", {
        params: { environment, app_name, limit }
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch logs with analysis:", error)
      throw error
    }
  },

  generateLLMAnalysis: async (logData) => {
    try {
      const response = await apiClient.post("/generate_llm_analysis", logData)
      return response.data
    } catch (error) {
      console.error("Failed to generate LLM analysis:", error)
      throw error
    }
  },
  getApplications: async (environment) => {
    try {
      const response = await apiClient.get("/applications", {
        params: { environment }
      })
      const applications = response.data.applications
      
      return {
        applications: applications,
        defaultApplication: applications[0] // Auto-select first application
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
      return {
        applications: ["server1", "server2", "server3"],
        defaultApplication: "server1"
      }
    }
  },    
  // Alerts
  getAlerts: async () => {
    try {
      const response = await apiClient.get("/alerts")
      return response.data
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
      return []
    }
  },

  getActiveAlerts: async (environment = null, severity = null, limit = 50) => {
    try {
      const params = new URLSearchParams()
      if (environment) params.append('environment', environment)
      if (severity) params.append('severity', severity)
      params.append('limit', limit.toString())
      
      const response = await apiClient.get(`/alerts/active?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch active alerts:", error)
      return []
    }
  },

  getAlertHistory: async (days = 7, environment = null, severity = null) => {
    try {
      const params = new URLSearchParams()
      params.append('days', days.toString())
      if (environment) params.append('environment', environment)
      if (severity) params.append('severity', severity)
      
      const response = await apiClient.get(`/alerts/history?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch alert history:", error)
      return []
    }
  },

  // Debug endpoint to inspect collection info
  getCollectionInfo: async () => {
    try {
      const response = await apiClient.get("/debug/collection-info")
      return response.data
    } catch (error) {
      console.error("Failed to fetch collection info:", error)
      return null
    }
  },
  
  getPredictiveMaintenanceFlags: async (environment = "All", app_name = "All") => {
    try {
      const response = await apiClient.get("/predictive-maintenance-flags", {
        params: { environment, app_name }
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch predictive maintenance flags:", error)
      return []
    }
  },

  getActiveAlerts: async () => {
    const response = await apiClient.get('/api/alerts/active');
    return response.data;
  },

  getPredictiveAnalysis: async (server_id) => {
    try {
      const response = await apiClient.get(`/predictive-analysis/${server_id}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch predictive analysis:", error)
      throw error
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get("/")
      return response.status === 200
    } catch (error) {
      return false
    }
  },

// Add these to your existing client.js api object
  getAlerts: async () => {
    try {
      const response = await apiClient.get("/alerts")
      return response.data
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
      return []
    }
  },

  getAlertManagerAlerts: async () => {
    try {
      const response = await apiClient.get("/alertmanager/alerts")
      return response.data
    } catch (error) {
      console.error("Failed to fetch AlertManager alerts:", error)
      return { error: error.message }
    }
  },

  getActiveAlerts: async (environment = null, severity = null, limit = 50) => {
    try {
      const params = new URLSearchParams()
      if (environment) params.append('environment', environment)
      if (severity) params.append('severity', severity)
      params.append('limit', limit.toString())
      
      const response = await apiClient.get(`/alerts/active?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch active alerts:", error)
      return []
    }
  },

  getAlertHistory: async (days = 7, environment = null, severity = null) => {
    try {
      const params = new URLSearchParams()
      params.append('days', days.toString())
      if (environment) params.append('environment', environment)
      if (severity) params.append('severity', severity)
      
      const response = await apiClient.get(`/alerts/history?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch alert history:", error)
      return []
    }
  },

  sendChatMessage: async (message, context = {}) => {
    try {
      const response = await apiClient.post("/chat/message", {
        message,
        context: {
          ...context,
          session_id: "default"
        },
        timestamp: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error("Failed to send chat message:", error)
      throw error
    }
  },

  getChatHistory: async (limit = 50, session_id = "default") => {
    try {
      const response = await apiClient.get("/chat/history", {
        params: { limit, session_id }
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch chat history:", error)
      return []
    }
  },

  getChatContext: async (message_id) => {
    try {
      const response = await apiClient.get(`/chat/context/${message_id}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch chat context:", error)
      return { error: "Context not available" }
    }
  },

  // Real-time polling utility
  startPolling: (callback, interval = 30000) => {
    const poll = async () => {
      try {
        await callback()
      } catch (error) {
        console.error("Polling error:", error)
      }
    }

    // Initial call
    poll()

    // Set up interval
    const intervalId = setInterval(poll, interval)

    // Return cleanup function
    return () => clearInterval(intervalId)
  }
}

// Individual export functions for convenience
export const {
  getLLMAnalysis,
  getLogsWithAnalysis,
  generateLLMAnalysis,
  getDashboardStats,
  getPerformanceSummary,
  getServerMetrics,
  getNetworkMetrics,
  getAppLogs,
  getEnvironments,
  getApplications,
  getAlerts,
  getCollectionInfo,
  healthCheck,
  startPolling
} = api

export default apiClient
