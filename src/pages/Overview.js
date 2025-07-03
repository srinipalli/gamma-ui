"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { Activity, Shield, AlertCircle, RefreshCw, CheckCircle, Server, Brain, AlertTriangle, Zap, Router, ShieldAlert } from "lucide-react"
import GrafanaChart from "../components/GrafanaChart"
import { api } from "../api/client"
import { getGlobalServerName } from "../utils/serverNaming"

// Liquid Glass Component
const LiquidGlass = ({ children, className = "", variant = "card", intensity = "medium", onClick, style, isDarkMode }) => {
  const [isHovering, setIsHovering] = useState(false)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })

const getVariantClasses = () => {
  const baseClasses = `liquid-glass relative overflow-hidden ${
    isDarkMode ? "" : "shadow-sm hover:shadow-md"
  }`
  
  switch (variant) {
    case "button":
      return `${baseClasses} cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] ${
        isDarkMode ? "" : "hover:shadow-lg"
      }`
    case "card":
      return `${baseClasses} transition-all duration-300 hover:scale-[1.01] ${
        isDarkMode ? "" : "hover:shadow-lg"
      }`
    case "panel":
      return `${baseClasses} ${isDarkMode ? "" : "shadow-md"}`
    default:
      return baseClasses
  }
}


const getIntensityClasses = () => {
  switch (intensity) {
    case "subtle":
      return `backdrop-blur-sm ${
        isDarkMode 
          ? "bg-gray-800/40 border-gray-600/40" 
          : "bg-white/70 border-gray-300/50 shadow-sm"
      }`
    case "strong":
      return `backdrop-blur-3xl ${
        isDarkMode 
          ? "bg-gray-800/80 border-gray-600/40" 
          : "bg-white/85 border-gray-300/60 shadow-lg"
      }`
    case "ultra":
      return `backdrop-blur-[40px] ${
        isDarkMode 
          ? "bg-gray-800/90 border-gray-600/40" 
          : "bg-white/95 border-gray-300/70 shadow-xl"
      }`
    default:
      return `backdrop-blur-xl ${
        isDarkMode 
          ? "bg-gray-800/60 border-gray-600/40" 
          : "bg-white/80 border-gray-300/60 shadow-md"
      }`
  }
}


  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      className={`
        ${getVariantClasses()}
        ${getIntensityClasses()}
        border rounded-2xl
        ${className}
      `}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Liquid Glass Effect - Only on Hover */}
      {isHovering && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: cursorPos.x - 60,
            top: cursorPos.y - 60,
            width: "120px",
            height: "120px",
            background: isDarkMode 
              ? "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, transparent 70%)"
              : "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 70%)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            filter: "blur(15px)",
            zIndex: 2,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Shimmer Effect - Only on Hover */}
      {isHovering && (
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? "bg-gradient-to-br from-white/5 via-transparent to-transparent" 
            : "bg-gradient-to-br from-white/20 via-transparent to-transparent"
        } pointer-events-none z-5 rounded-2xl`} />
      )}
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

const Overview = ({ selectedEnvironment, selectedApp, isDarkMode, onPageChange }) => {
  const [performanceSummary, setPerformanceSummary] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryData, setSummaryData] = useState({})
  const [dashboardStats, setDashboardStats] = useState({})
  const [predictiveFlags, setPredictiveFlags] = useState([])
  const [ddosServers, setDdosServers] = useState(0)

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

  const fetchDdosActivity = async () => {
    try {
      const ddosData = await api.getDdosActivity(selectedEnvironment, selectedApp)
      setDdosServers(ddosData.unique_servers || 0)
    } catch (error) {
      console.error("Failed to fetch DDoS activity:", error)
      setDdosServers(0)
    }
  }

  const fetchPerformanceSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const response = await api.getPerformanceSummary(selectedEnvironment, selectedApp)
      setPerformanceSummary(response.summary || "System monitoring is active. All infrastructure components are being tracked.")
      setSummaryData(response.data || {})
    } catch (error) {
      console.error("Failed to fetch performance summary:", error)
      const criticalCount = dashboardStats.health_stats?.find(s => s._id === "Critical")?.count || 0
      const fallbackSummary = criticalCount > 0 
        ? "Critical infrastructure issues detected requiring immediate attention. System stability at risk with server failures identified.\n\nKey Insights:\n• Server health monitoring active\n• Critical alerts require immediate response\n• Infrastructure stability assessment needed"
        : "Infrastructure monitoring active with predictive maintenance alerts. Continue standard monitoring procedures for optimal performance.\n\nKey Insights:\n• All systems operational within normal parameters\n• Predictive maintenance monitoring active\n• Regular monitoring procedures recommended"
      setPerformanceSummary(fallbackSummary)
    } finally {
      setSummaryLoading(false)
    }
  }, [selectedEnvironment, selectedApp, dashboardStats])

  const getActiveServerCount = () => {
    if (summaryData?.server_metrics?.total_servers) {
      return summaryData.server_metrics.total_servers
    }
    const healthStats = dashboardStats.health_stats || []
    return healthStats.reduce((sum, stat) => sum + stat.count, 0) || 0
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchPredictiveFlags()
    fetchDdosActivity()
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
      const flags = await api.getPredictiveMaintenanceFlags(selectedEnvironment, selectedApp)
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
    localStorage.setItem("highlightServer", globalServerName)
    localStorage.setItem("predictiveServer", globalServerName)
    localStorage.setItem("autoOpenAnalysis", "true")
    localStorage.setItem("serverEnvironment", environment)
    onPageChange("server-metrics")
  }

  const { mainSummary, insights } = parseAISummary(performanceSummary)

  return (
    <div className={`space-y-8 relative min-h-screen ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30"
    }`}>
      
{/* Unified Dashboard Metrics Container */}
<LiquidGlass 
  variant="card" 
  intensity="strong"
  isDarkMode={isDarkMode}
  className="p-6"
>
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Active Servers */}
    <LiquidGlass 
      variant="card" 
      intensity="medium"
      isDarkMode={isDarkMode}
      className="p-6 transition-all duration-300 hover:scale-105"
    >
      <div className="flex items-start">
        <Server className="w-8 h-8 text-blue-500 mt-1" />
        <div className="ml-4 flex-1">
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
            Active Servers
          </p>
          <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
            {getActiveServerCount()}
          </p>
          <p className="text-xs text-gray-300">Monitored</p>
        </div>
      </div>
    </LiquidGlass>

    {/* At-Risk Servers - Click to go to server metrics */}
    <LiquidGlass 
      variant="card" 
      intensity="medium"
      isDarkMode={isDarkMode}
      className="p-6 cursor-pointer transition-all duration-300 hover:scale-105"
      onClick={() => onPageChange("server-metrics")}
    >
      <div className="flex items-start">
        <Zap className="w-8 h-8 text-orange-500 mt-1" />
        <div className="ml-4 flex-1">
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
            At-Risk Servers
          </p>
          <p className="text-2xl font-bold text-orange-600 mb-1">
            {predictiveFlags.length}
          </p>
          <p className="text-xs text-gray-300">Servers at risk</p>
        </div>
      </div>
    </LiquidGlass>

    {/* DDoS Threats - Click to go to network metrics */}
    <LiquidGlass 
      variant="card" 
      intensity="medium"
      isDarkMode={isDarkMode}
      className="p-6 cursor-pointer transition-all duration-300 hover:scale-105"
      onClick={() => onPageChange("network-metrics")}
    >
      <div className="flex items-start">
        <Shield className="w-8 h-8 text-red-500 mt-1" />
        <div className="ml-4 flex-1">
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
            DDoS Threats
          </p>
          <p className="text-2xl font-bold text-red-600 mb-1">
            {ddosServers}
          </p>
          <p className="text-xs text-gray-300">Servers at risk</p>
        </div>
      </div>
    </LiquidGlass>

    {/* Application Errors - Click to go to app logs */}
    <LiquidGlass 
      variant="card" 
      intensity="medium"
      isDarkMode={isDarkMode}
      className="p-6 cursor-pointer transition-all duration-300 hover:scale-105"
      onClick={() => onPageChange("app-logs")}
    >
      <div className="flex items-start">
        <AlertTriangle className="w-8 h-8 text-red-500 mt-1" />
        <div className="ml-4 flex-1">
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
            Application Errors
          </p>
          <p className="text-2xl font-bold text-red-600 mb-1">
            {dashboardStats.error_stats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
          </p>
          <p className="text-xs text-gray-300">Last 24 hours</p>
        </div>
      </div>
    </LiquidGlass>
  </div>
</LiquidGlass>

      {/* AI Performance Summary with Liquid Glass */}
      <LiquidGlass 
        variant="card" 
        intensity="strong"
        isDarkMode={isDarkMode}
        className="p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center">
              <h2 className={`text-xl font-bold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <Brain className="w-6 h-6 mr-2 text-purple-600" />
                Performance Summary
              </h2>
              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <span className="w-2 h-2 rounded-full mr-1 bg-white" />
                AI Generated
              </span>
            </div>
            <p className={`text-sm text-gray-600 mt-1 ${isDarkMode ? "text-gray-400" : ""}`}>
              Past 24 Hours • Real-time Analysis
            </p>
          </div>
          <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
            <button
              onClick={fetchPerformanceSummary}
              disabled={summaryLoading}
              className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${
                isDarkMode 
                  ? "bg-purple-900/50 hover:bg-purple-800/50 text-purple-300" 
                  : "bg-purple-50/50 hover:bg-purple-100/50 text-purple-600"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </LiquidGlass>
        </div>

        {summaryLoading ? (
          <div className="flex items-center space-x-2">
            <div className="rounded-full h-4 w-4 border-b-2 border-purple-600 animate-spin" />
            <span className={`text-gray-600 ${isDarkMode ? "text-gray-400" : ""}`}>
              AI is analyzing performance data...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI System Analysis */}
            <LiquidGlass 
  variant="panel" 
  intensity="medium"
  isDarkMode={isDarkMode}
  className={`p-4 ${isDarkMode ? "border-purple-600/30" : "border-purple-200/30"}`}
>
  <div className="flex items-center mb-3">
    <Brain className="w-5 h-5 text-purple-600 mr-2" />
    <h3 className={`font-semibold ${isDarkMode ? "text-purple-400" : "text-purple-800"}`}>AI Analysis</h3>
  </div>
  <div className={`leading-relaxed ${isDarkMode ? "text-white" : "text-gray-700"}`}>
    <p className={`text-sm mb-3 ${isDarkMode ? "text-white" : "text-gray-700"}`}>{mainSummary}</p>
    {insights.length > 0 && (
      <div>
        <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>
          Key Insights:
        </h4>
        <div className="space-y-1">
          {insights.map((insight, index) => (
            <p key={index} className={`text-xs ${isDarkMode ? "text-gray-100" : "text-gray-600"}`}>
              {insight}
            </p>
          ))}
        </div>
      </div>
    )}
  </div>
</LiquidGlass>


            {/* Failure Risk Detection */}
            {predictiveFlags.length > 0 && (
              <LiquidGlass 
                variant="panel" 
                intensity="medium"
                isDarkMode={isDarkMode}
                className={`p-4 ${isDarkMode ? "border-red-600/30" : "border-red-200/30"}`}
              >
                <div className="flex items-center mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className={`font-semibold ${isDarkMode ? "text-red-500" : "text-red-800"}`}>
                    Critical Servers - Failure Risk Detected
                  </h3>
                </div>
                <div className="space-y-3">
                  {predictiveFlags.slice(0, 3).map((flag, index) => (
                    <LiquidGlass
                      key={index}
                      variant="button"
                      intensity="subtle"
                      isDarkMode={isDarkMode}
                      className={`p-3 w-full ${
                        isDarkMode
                          ? "border-gray-700/50"
                          : "border-red-200/50"
                      }`}
                      onClick={() => handleServerClick(flag.server_name, flag.environment)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDarkMode ? "text-red-400" : "text-red-700"}`}>
                          {getGlobalServerName(flag.server_name, flag.environment)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          flag.confidence === "High"
                            ? "bg-red-100/80 text-red-700"
                            : "bg-orange-100/80 text-orange-700"
                        }`}>
                          {flag.confidence} Risk
                        </span>
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                        <strong>Issue:</strong> {flag.predicted_issue?.substring(0, 80)}...
                      </div>
                    </LiquidGlass>
                  ))}
                  {predictiveFlags.length > 3 && (
                    <div className="text-center">
                      <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        +{predictiveFlags.length - 3} more servers need attention
                      </span>
                    </div>
                  )}
                </div>
              </LiquidGlass>
            )}
          </div>
        )}
      </LiquidGlass>

      {/* Grafana Charts on Single Liquid Glass Panel */}
      <LiquidGlass 
        variant="panel" 
        intensity="ultra"
        isDarkMode={isDarkMode}
        className="p-8"
      >
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-2`}>
            System Performance Metrics
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Real-time monitoring and analytics dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiquidGlass variant="card" intensity="medium" isDarkMode={isDarkMode} className="p-4">
            <GrafanaChart
              title="CPU Usage Trends"
              panelId={1}
              variables={{
                environment: selectedEnvironment !== "All" ? selectedEnvironment : "",
                application: selectedApp !== "All" ? selectedApp : "",
              }}
              isDarkMode={isDarkMode}
            />
          </LiquidGlass>
          
          <LiquidGlass variant="card" intensity="medium" isDarkMode={isDarkMode} className="p-4">
            <GrafanaChart
              title="Disk Utilization Trends"
              panelId={2}
              variables={{
                environment: selectedEnvironment !== "All" ? selectedEnvironment : "",
                application: selectedApp !== "All" ? selectedApp : "",
              }}
              isDarkMode={isDarkMode}
            />
          </LiquidGlass>
          
          <LiquidGlass variant="card" intensity="medium" isDarkMode={isDarkMode} className="p-4">
            <GrafanaChart
              title="Memory Usage Trends"
              panelId={3}
              variables={{
                environment: selectedEnvironment !== "All" ? selectedEnvironment : "",
                application: selectedApp !== "All" ? selectedApp : "",
              }}
              isDarkMode={isDarkMode}
            />
          </LiquidGlass>
          
          <LiquidGlass variant="card" intensity="medium" isDarkMode={isDarkMode} className="p-4">
            <GrafanaChart
              title="CPU Temperature Trends"
              panelId={4}
              variables={{
                environment: selectedEnvironment !== "All" ? selectedEnvironment : "",
                application: selectedApp !== "All" ? selectedApp : "",
              }}
              isDarkMode={isDarkMode}
            />
          </LiquidGlass>
        </div>
      </LiquidGlass>
    </div>
  )
}

export default Overview