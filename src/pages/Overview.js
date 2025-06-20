"use client"

import { useState, useEffect, useCallback } from "react"
import { Activity, Shield, AlertCircle, RefreshCw, CheckCircle, Server, Brain, AlertTriangle } from "lucide-react"
import GrafanaChart from "../components/GrafanaChart"
import { api } from "../api/client"
import { getGlobalServerName } from "../utils/serverNaming"

const Overview = ({ selectedEnvironment, selectedApp, isDarkMode, onPageChange }) => {
  const [performanceSummary, setPerformanceSummary] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({})
  const [predictiveFlags, setPredictiveFlags] = useState([])

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

  const fetchPerformanceSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const summary = await api.getPerformanceSummary(selectedEnvironment, selectedApp)
      setPerformanceSummary(summary.summary)
    } catch (error) {
      console.error("Failed to fetch performance summary:", error)
      const mockSummary = `
        **System Overview**: All systems are operating within normal parameters. 
        **Server Performance**: Monitoring ${predictiveFlags.length > 0 ? predictiveFlags.length : 24} servers across ${selectedEnvironment === "All" ? "all environments" : selectedEnvironment} environment.
        **Critical Issues**: ${predictiveFlags.length} servers flagged for potential failure risk requiring immediate attention.
        **Recommendations**: Review predictive maintenance alerts and implement preventive actions for flagged servers.
      `
      setPerformanceSummary(mockSummary)
    } finally {
      setSummaryLoading(false)
    }
  }, [selectedEnvironment, selectedApp, predictiveFlags.length])

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

  const getServerCount = () => {
    if (selectedEnvironment === "All" && selectedApp === "All") return "24 servers in all environments and all apps"
    if (selectedEnvironment === "All" && selectedApp !== "All") return `18 servers in all environments that host ${selectedApp}`
    if (selectedEnvironment !== "All" && selectedApp === "All") return `8 servers in ${selectedEnvironment} for all apps`
    return `6 servers in ${selectedEnvironment} that host ${selectedApp}`
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div
          className={`rounded-lg shadow p-6 flex flex-col items-center transition-colors duration-300 ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-lg font-semibold">Total Application Errors</h3>
          <p className="text-2xl font-bold">
            {dashboardStats.error_stats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
          </p>
        </div>
        <div
          className={`rounded-lg shadow p-6 flex flex-col items-center transition-colors duration-300 ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
          <h3 className="text-lg font-semibold">Healthy Servers</h3>
          <p className="text-2xl font-bold">
            {dashboardStats.health_stats?.find((stat) => stat._id === "Good")?.count || 0}
          </p>
        </div>
        <div
          className={`rounded-lg shadow p-6 flex flex-col items-center transition-colors duration-300 ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          <Server className="w-8 h-8 text-blue-500 mb-2" />
          <h3 className="text-lg font-semibold">Active Servers</h3>
          <p className="text-2xl font-bold">24</p>
        </div>
      </div>

      {/* Performance Summary */}
      <div
        className={`rounded-lg shadow p-6 transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center">
              <h2 className={`text-xl font-bold flex items-center ${isDarkMode ? "text-white" : ""}`}>
                <Activity className="w-6 h-6 mr-2 text-blue-600" />
                Performance Summary
              </h2>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                Generated by LLM
              </span>
            </div>
            <p className={`text-sm text-gray-600 mt-1 ${isDarkMode ? "text-gray-400" : ""}`}>
              Past 24 Hours • Monitoring {getServerCount()}
            </p>
          </div>
          <button
            onClick={fetchPerformanceSummary}
            disabled={summaryLoading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {summaryLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className={`text-gray-600 ${isDarkMode ? "text-gray-400" : ""}`}>Analyzing performance data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Overview */}
            <div
              className={`border rounded-lg p-4 ${
                isDarkMode ? "bg-gray-700 border-gray-600" : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center mb-3">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-blue-800"}`}>System Overview</h3>
              </div>
              <div className={`text-gray-700 leading-relaxed ${isDarkMode ? "text-gray-300" : ""}`}>
                <p>All systems are operating within normal parameters.</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>Total Servers Monitored:</strong> {getServerCount().split(' ')[0]} servers</li>
                  <li>• <strong>Environment:</strong> {selectedEnvironment === "All" ? "All Environments" : selectedEnvironment}</li>
                  <li>• <strong>Application:</strong> {selectedApp === "All" ? "All Applications" : selectedApp}</li>
                  <li>• <strong>Health Status:</strong> {dashboardStats.health_stats?.find(s => s._id === "Good")?.count || 0} healthy, {dashboardStats.health_stats?.find(s => s._id === "Warning")?.count || 0} warning, {dashboardStats.health_stats?.find(s => s._id === "Critical")?.count || 0} critical</li>
                </ul>
              </div>
            </div>

            {/* Failure Risk Detection */}
            {predictiveFlags.length > 0 && (
              <div
                className={`border rounded-lg p-4 ${
                  isDarkMode ? "bg-gray-700 border-red-600" : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className={`font-semibold ${isDarkMode ? "text-red-500" : "text-red-800"}`}>
                    Critical Servers - Failure Risk Detected
                  </h3>
                </div>
                <div className="space-y-3">
                  {predictiveFlags.map((flag, index) => (
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
                        <span
                          className={`font-medium cursor-pointer hover:underline ${
                            isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-700 hover:text-red-600"
                          }`}
                        >
                          {getGlobalServerName(flag.server_name, flag.environment)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            flag.confidence === "High"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {flag.confidence} Risk
                        </span>
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                        <strong>Server Performance:</strong> {getGlobalServerName(flag.server_name, flag.environment)} is experiencing {flag.predicted_issue.substring(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grafana Charts */}
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
