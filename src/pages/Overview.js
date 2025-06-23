"use client"

import { useState, useEffect, useCallback } from "react"
import { Activity, Shield, AlertCircle, RefreshCw, CheckCircle, Server, Brain, AlertTriangle, Zap } from "lucide-react"
import GrafanaChart from "../components/GrafanaChart"
import { api } from "../api/client"
import { getGlobalServerName } from "../utils/serverNaming"

const Overview = ({ selectedEnvironment, selectedApp, isDarkMode, onPageChange }) => {
  const [performanceSummary, setPerformanceSummary] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryData, setSummaryData] = useState({})
  const [dashboardStats, setDashboardStats] = useState({})
  const [predictiveFlags, setPredictiveFlags] = useState([])

  // Helper function to parse AI summary with insights
  const parseAISummary = (summary) => {
    const parts = summary.split('Key Insights:')
    if (parts.length === 2) {
      const mainSummary = parts[0].trim()
      const insights = parts[1].trim().split('\n').filter(line => line.trim().startsWith('•')).map(line => line.trim())
      return { mainSummary, insights }
    }
    return { mainSummary: summary, insights: [] }
  }

  const fetchPerformanceSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const response = await api.getPerformanceSummary(selectedEnvironment, selectedApp)
      console.log("Performance summary response:", response)
      
      setPerformanceSummary(response.summary || "System monitoring is active. All infrastructure components are being tracked.")
      setSummaryData(response.data || {})
      
    } catch (error) {
      console.error("Failed to fetch performance summary:", error)
      
      // Enhanced fallback with insights
      const criticalCount = dashboardStats.health_stats?.find(s => s._id === "Critical")?.count || 0
      const fallbackSummary = criticalCount > 0 
        ? "Critical infrastructure issues detected requiring immediate attention. System stability at risk with server failures identified.\n\nKey Insights:\n• Server health monitoring active\n• Critical alerts require immediate response\n• Infrastructure stability assessment needed"
        : "Infrastructure monitoring active with predictive maintenance alerts. Continue standard monitoring procedures for optimal performance.\n\nKey Insights:\n• All systems operational within normal parameters\n• Predictive maintenance monitoring active\n• Regular monitoring procedures recommended"
      
      setPerformanceSummary(fallbackSummary)
    } finally {
      setSummaryLoading(false)
    }
  }, [selectedEnvironment, selectedApp, dashboardStats])

  // Get the actual server count from API data
  const getActiveServerCount = () => {
    if (summaryData?.server_metrics?.total_servers) {
      return summaryData.server_metrics.total_servers
    }
    // Fallback to dashboard stats calculation
    const healthStats = dashboardStats.health_stats || []
    return healthStats.reduce((sum, stat) => sum + stat.count, 0) || 0
  }

  // Rest of your existing useEffect and fetch functions remain the same...
  useEffect(() => {
    fetchDashboardStats()
    fetchPredictiveFlags()
  }, [selectedEnvironment, selectedApp])

  const fetchDashboardStats = async () => {
    try {
      const stats = await api.getDashboardStats(selectedEnvironment, selectedApp)
      setDashboardStats(stats)
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
      setDashboardStats({
        error_stats: [
          { _id: "ERROR", count: 12 },
          { _id: "WARNING", count: 8 },
        ],
        health_stats: [
          { _id: "Good", count: 18 },
          { _id: "Warning", count: 4 },
          { _id: "Critical", count: 2 },
        ],
      })
    }
  }

  const fetchPredictiveFlags = async () => {
    try {
      console.log("Overview: Fetching predictive flags for:", selectedEnvironment, selectedApp)
      const flags = await api.getPredictiveMaintenanceFlags(selectedEnvironment, selectedApp)
      console.log("Overview: Received predictive flags:", flags)
      setPredictiveFlags(flags)
    } catch (error) {
      console.error("Failed to fetch predictive flags:", error)
    }
  }

  useEffect(() => {
    fetchPerformanceSummary()
  }, [fetchPerformanceSummary])

  const handleServerClick = (serverName, environment) => {
    const globalServerName = getGlobalServerName(serverName, environment)
    console.log("Overview: handleServerClick called with:", { serverName, environment, globalServerName })
    localStorage.setItem("highlightServer", globalServerName)
    localStorage.setItem("predictiveServer", globalServerName)
    localStorage.setItem("autoOpenAnalysis", "true")
    localStorage.setItem("serverEnvironment", environment)
    onPageChange("server-metrics")
  }

  const { mainSummary, insights } = parseAISummary(performanceSummary)

  return (
    <div className="space-y-8">
      {/* Enhanced Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className={`rounded-lg shadow p-6 flex flex-col items-center transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-lg font-semibold">Application Errors</h3>
          <p className="text-2xl font-bold">
            {dashboardStats.error_stats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
        </div>
        
        <div className={`rounded-lg shadow p-6 flex flex-col items-center transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
          <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
          <h3 className="text-lg font-semibold">Healthy Servers</h3>
          <p className="text-2xl font-bold">
            {dashboardStats.health_stats?.find((stat) => stat._id === "Good")?.count || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Current status</p>
        </div>
        
        <div className={`rounded-lg shadow p-6 flex flex-col items-center transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
          <Server className="w-8 h-8 text-blue-500 mb-2" />
          <h3 className="text-lg font-semibold">Active Servers</h3>
          <p className="text-2xl font-bold">
            {getActiveServerCount()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Monitored</p>
         
        </div>
        
        <div className={`rounded-lg shadow p-6 flex flex-col items-center transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
          <Zap className="w-8 h-8 text-orange-500 mb-2" />
          <h3 className="text-lg font-semibold">At-Risk Servers</h3>
          <p className="text-2xl font-bold text-orange-600">
            {predictiveFlags.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Predictive alerts</p>
        </div>
      </div>

      {/* Enhanced AI Performance Summary */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center">
              <h2 className={`text-xl font-bold flex items-center ${isDarkMode ? "text-white" : ""}`}>
                <Brain className="w-6 h-6 mr-2 text-purple-600" />
                AI Performance Summary
              </h2>
              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <span className="w-2 h-2 rounded-full mr-1 bg-white animate-pulse"></span>
                AI Generated
              </span>
            </div>
            <p className={`text-sm text-gray-600 mt-1 ${isDarkMode ? "text-gray-400" : ""}`}>
              Past 24 Hours • Real-time Analysis
            </p>
          </div>
          <button
            onClick={fetchPerformanceSummary}
            disabled={summaryLoading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {summaryLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className={`text-gray-600 ${isDarkMode ? "text-gray-400" : ""}`}>
              AI is analyzing performance data...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI System Analysis */}
            <div className={`border rounded-lg p-4 ${isDarkMode ? "bg-gray-700 border-purple-600" : "bg-purple-50 border-purple-200"}`}>
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className={`font-semibold ${isDarkMode ? "text-purple-400" : "text-purple-800"}`}>AI Analysis</h3>
              </div>
              <div className={`text-gray-700 leading-relaxed ${isDarkMode ? "text-gray-300" : ""}`}>
                <p className="text-sm mb-3">
                  {mainSummary}
                </p>
                {insights.length > 0 && (
                  <div>
                    <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>
                      Key Insights:
                    </h4>
                    <div className="space-y-1">
                      {insights.map((insight, index) => (
                        <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                          {insight}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Failure Risk Detection */}
            {predictiveFlags.length > 0 && (
              <div className={`border rounded-lg p-4 ${isDarkMode ? "bg-gray-700 border-red-600" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className={`font-semibold ${isDarkMode ? "text-red-500" : "text-red-800"}`}>
                    Critical Servers - Failure Risk Detected
                  </h3>
                </div>
                <div className="space-y-3">
                  {predictiveFlags.slice(0, 3).map((flag, index) => (
                    <div
                      key={index}
                      className={`border rounded p-3 cursor-pointer hover:shadow-md transition-all duration-200 ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                          : "bg-white border-red-200 hover:bg-gray-50"
                      }`}
                      onClick={() => handleServerClick(flag.server_name, flag.environment)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium cursor-pointer hover:underline ${isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-700 hover:text-red-600"}`}>
                          {getGlobalServerName(flag.server_name, flag.environment)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          flag.confidence === "High"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {flag.confidence} Risk
                        </span>
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                        <strong>Issue:</strong> {flag.predicted_issue?.substring(0, 80)}...
                      </div>
                    </div>
                  ))}
                  {predictiveFlags.length > 3 && (
                    <div className="text-center">
                      <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        +{predictiveFlags.length - 3} more servers need attention
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grafana Charts - keeping your existing charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrafanaChart
          title="CPU Usage Trends"
          panelId={1}
          variables={{
            environment: selectedEnvironment !== "All" ? selectedEnvironment : "",
            application: selectedApp !== "All" ? selectedApp : "",
          }}
          isDarkMode={isDarkMode}
        />
        <GrafanaChart
          title="Disk Utilization Trends"
          panelId={2}
          variables={{
            environment: selectedEnvironment !== "All" ? selectedEnvironment : "",
            application: selectedApp !== "All" ? selectedApp : "",
          }}
          isDarkMode={isDarkMode}
        />
        <GrafanaChart
          title="Memory Usage Trends"
          panelId={3}
          variables={{
            environment: selectedEnvironment !== "All" ? selectedEnvironment : "",
            application: selectedApp !== "All" ? selectedApp : "",
          }}
          isDarkMode={isDarkMode}
        />
        <GrafanaChart
          title="CPU Temperature Trends"
          panelId={4}
          variables={{
            environment: selectedEnvironment !== "All" ? selectedEnvironment : "",
            application: selectedApp !== "All" ? selectedApp : "",
          }}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  )
}

export default Overview
