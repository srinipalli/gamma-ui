"use client"

import { useState, useEffect } from "react"
import { 
  Activity, 
  Wifi, 
  Globe, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  Server,
  CheckCircle,
  AlertTriangle,
  Cpu,
  HardDrive,
  Thermometer,
  Brain,
  X
} from "lucide-react"
import { api } from "../api/client"
import { getGlobalServerName, getServerDisplayName } from "../utils/serverNaming"
import LiquidGlass from "../components/LiquidGlass"

const ServerMetrics = ({ selectedEnvironment, selectedApp, isDarkMode }) => {
  const [serverMetrics, setServerMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverStats, setServerStats] = useState({
    totalServers: 0,
    healthyServers: 0,
    criticalServers: 0,
    avgCpuUsage: 0,
    avgMemoryUsage: 0,
    avgDiskUsage: 0
  })
  const [predictiveFlags, setPredictiveFlags] = useState([])
  const [selectedServerForAnalysis, setSelectedServerForAnalysis] = useState(null)
  const [showLLMAnalysis, setShowLLMAnalysis] = useState(false)
  const [predictiveAnalysis, setPredictiveAnalysis] = useState(null)
  const [highlightedServer, setHighlightedServer] = useState(null)

  useEffect(() => {
    console.log("ServerMetrics: useEffect triggered")
    console.log("ServerMetrics: predictiveFlags length:", predictiveFlags.length)
    console.log("ServerMetrics: loading state:", loading)
    
    const serverToHighlight = localStorage.getItem("highlightServer")
    const predictiveServer = localStorage.getItem("predictiveServer")
    const autoOpenAnalysis = localStorage.getItem("autoOpenAnalysis")
    const serverEnvironment = localStorage.getItem("serverEnvironment")
    
    console.log("ServerMetrics: localStorage values:", {
      serverToHighlight,
      predictiveServer,
      autoOpenAnalysis,
      serverEnvironment
    })
    
    // Handle highlighting (this can happen immediately)
    if (serverToHighlight) {
      console.log("ServerMetrics: Setting highlighted server:", serverToHighlight)
      setHighlightedServer(serverToHighlight)
      localStorage.removeItem("highlightServer")

      setTimeout(() => {
        setHighlightedServer(null)
      }, 3000)
    }
    
    // Handle auto-opening analysis - ONLY clear localStorage when we actually open the modal
    if (predictiveServer && autoOpenAnalysis && predictiveFlags.length > 0 && !loading) {
      console.log("ServerMetrics: Conditions met for auto-opening analysis")
      
      // Parse the global server name
      const parts = predictiveServer.split('-')
      const environment = parts[0]
      const serverName = parts[1]
      
      console.log("ServerMetrics: Parsed server info:", { environment, serverName })
      
      // Check if this server actually has predictive flags (case-insensitive)
      const hasFlag = predictiveFlags.some(flag => {
        const flagEnv = flag.environment.toLowerCase()
        const searchEnv = environment.toLowerCase()
        const matches = flag.server_name === serverName && flagEnv === searchEnv
        console.log("ServerMetrics: Checking flag:", flag.server_name, flagEnv, "vs", serverName, searchEnv, "=", matches)
        return matches
      })
      
      console.log("ServerMetrics: Has flag result:", hasFlag)
      
      if (hasFlag) {
        console.log(`ServerMetrics: Auto-opening analysis for ${predictiveServer}`)
        
        // ONLY clear localStorage when we successfully open the modal
        localStorage.removeItem("predictiveServer")
        localStorage.removeItem("autoOpenAnalysis")
        localStorage.removeItem("serverEnvironment")
        
        setSelectedServerForAnalysis(predictiveServer)
        fetchPredictiveAnalysis(serverName, environment)
        setShowLLMAnalysis(true)
      } else {
        console.log(`ServerMetrics: No predictive flag found for ${predictiveServer}`)
        // Clear localStorage even if no flag found to prevent infinite retries
        localStorage.removeItem("predictiveServer")
        localStorage.removeItem("autoOpenAnalysis")
        localStorage.removeItem("serverEnvironment")
      }
    } else {
      console.log("ServerMetrics: Conditions not met:", {
        hasPredictiveServer: !!predictiveServer,
        hasAutoOpen: !!autoOpenAnalysis,
        hasPredictiveFlags: predictiveFlags.length > 0,
        notLoading: !loading
      })
    }
  }, [predictiveFlags, loading])

  useEffect(() => {
    fetchServerMetrics()
    fetchPredictiveFlags()
  }, [selectedEnvironment, selectedApp])

  const calculateServerStats = (metrics) => {
    if (!metrics || metrics.length === 0) {
      return {
        totalServers: 0,
        healthyServers: 0,
        criticalServers: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgDiskUsage: 0
      }
    }

    const totalServers = metrics.length
    const healthyServers = metrics.filter(m => m.server_health === "Good").length
    const criticalServers = metrics.filter(m => 
      m.server_health === "Critical" || m.server_health === "Bad"
    ).length

    const avgCpuUsage = metrics.reduce((sum, m) => sum + (m.cpu_usage || 0), 0) / totalServers
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + (m.memory_usage || 0), 0) / totalServers
    const avgDiskUsage = metrics.reduce((sum, m) => sum + (m.disk_utilization || 0), 0) / totalServers

    return {
      totalServers,
      healthyServers,
      criticalServers,
      avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      avgDiskUsage: Math.round(avgDiskUsage * 100) / 100
    }
  }

  const fetchServerMetrics = async () => {
    try {
      setLoading(true)
      const metrics = await api.getServerMetrics(selectedEnvironment, selectedApp)
      setServerMetrics(metrics)
      // Calculate stats
      const stats = calculateServerStats(metrics)
      setServerStats(stats)
    } catch (error) {
      console.error("Failed to fetch server metrics:", error)
      // Fallback data
      setServerMetrics([
        {
          server: "server1",
          environment: "Development",
          cpu_usage: 75.2,
          memory_usage: 68.5,
          disk_utilization: 45.3,
          cpu_temp: 42.9,
          power_consumption: 108.51,
          clock_speed: 4.04,
          cache_miss_rate: 0.67,
          server_health: "Good",
          ip_address: "192.168.1.100",
          cpu_name: "Intel Xeon E5-2699"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchPredictiveFlags = async () => {
    try {
      console.log("ServerMetrics: Fetching predictive flags for:", selectedEnvironment, selectedApp)
      const flags = await api.getPredictiveMaintenanceFlags(selectedEnvironment, selectedApp)
      console.log("ServerMetrics: Received predictive flags:", flags)
      
      // Filter flags to only show servers that actually exist in current environment
      const filteredFlags = flags.filter(flag => {
        if (selectedEnvironment !== "All") {
          const envMapping = {
            "Development": "Dev",
            "Staging": "Stage",
            "Production": "Prod",
            "QA": "QA"
          }
          const dbEnv = envMapping[selectedEnvironment]
          return flag.environment === dbEnv
        }
        return true
      })
      
      console.log("ServerMetrics: Filtered flags:", filteredFlags)
      setPredictiveFlags(filteredFlags)
    } catch (error) {
      console.error("Failed to fetch predictive flags:", error)
    }
  }

  const fetchPredictiveAnalysis = async (serverName, environment) => {
    try {
      console.log(`Fetching analysis for server: ${serverName}, environment: ${environment}`)
      
      // Try multiple server ID formats to match your MongoDB data
      const serverIds = [
        `${environment}-${serverName}`, // Dev-server1
        `${environment.substring(0, 4)}-${serverName}`, // Prod-server1  
        serverName, // server1
        `${environment.toLowerCase()}-${serverName}`, // dev-server1
      ]
      
      let analysis = null
      
      for (const serverId of serverIds) {
        try {
          console.log(`Trying server ID: ${serverId}`)
          analysis = await api.getPredictiveAnalysis(serverId)
          if (analysis) {
            console.log(`Found analysis for server ID: ${serverId}`)
            break
          }
        } catch (error) {
          console.log(`Failed with server ID ${serverId}:`, error)
        }
      }
      
      if (analysis) {
        setPredictiveAnalysis(analysis)
      } else {
        console.error("No predictive analysis found for any server ID format")
        setPredictiveAnalysis(null)
      }
    } catch (error) {
      console.error("Failed to fetch predictive analysis:", error)
      setPredictiveAnalysis(null)
    }
  }

  const closeModal = () => {
    setShowLLMAnalysis(false)
    setSelectedServerForAnalysis(null)
    setPredictiveAnalysis(null)
  }

  const handleModalClick = (e) => {
    // Close modal if clicking on the backdrop
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  const getGlobalServerName = (serverName, environment) => {
    return `${environment}-${serverName}`
  }

  const isServerFlagged = (serverName, environment) => {
    console.log(`Checking if ${serverName} in ${environment} is flagged`)
    
    // Map frontend environment names to database environment names
    const envMapping = {
      "Development": "Dev",
      "Staging": "Stage", 
      "Production": "Prod",
      "QA": "QA"
    }
    
    const dbEnv = envMapping[environment] || environment
    
    const isFlagged = predictiveFlags.some(flag => {
      const matches = flag.server_name === serverName && flag.environment === dbEnv
      console.log(`Comparing: ${flag.server_name}/${flag.environment} vs ${serverName}/${dbEnv} = ${matches}`)
      return matches
    })
    
    console.log(`Result: ${serverName}/${environment} is flagged: ${isFlagged}`)
    return isFlagged
  }

  const ServerMetricCard = ({ metric }) => {
    const globalServerName = getGlobalServerName(metric.server, metric.environment)
    const isFlagged = isServerFlagged(metric.server, metric.environment)
    const isHighlighted = highlightedServer === globalServerName

    return (
      <LiquidGlass 
        variant="card" 
        intensity="medium"
        isDarkMode={isDarkMode}
        className={`p-5 transition-all duration-700 cursor-pointer hover:scale-105 ${
          isHighlighted
            ? "bg-yellow-200 border-4 border-yellow-500 transform scale-105"
            : isFlagged
              ? isDarkMode
                ? "border-2 border-red-600 bg-red-900/20" 
                : "border-2 border-red-500 bg-red-50/50"
              : ""
        }`}
        onClick={() => {
          if (isFlagged) {
            setSelectedServerForAnalysis(globalServerName) 
            fetchPredictiveAnalysis(metric.server, metric.environment)
            setShowLLMAnalysis(true)
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-md font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {globalServerName}
              <span className={`text-xs ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                ({metric.environment})
              </span>
            </h4>
            <div className="flex items-center gap-2">
              {isFlagged && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white">
                  Failure Risk
                </span>
              )}
            </div>
          </div>

          {/* CPU Usage */}
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>CPU:</span>
            <span
              className={`ml-auto font-mono ${
                metric.cpu_usage > 90
                  ? "text-red-600 font-bold"
                  : metric.cpu_usage > 80
                    ? "text-yellow-600"
                    : isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {metric.cpu_usage}%
            </span>
          </div>

          {/* Memory Usage */}
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Memory:</span>
            <span
              className={`ml-auto font-mono ${
                metric.memory_usage > 90
                  ? "text-red-600 font-bold"
                  : metric.memory_usage > 80
                    ? "text-yellow-600"
                    : isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {metric.memory_usage}%
            </span>
          </div>

          {/* Disk Usage */}
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-purple-500" />
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Disk:</span>
            <span
              className={`ml-auto font-mono ${
                metric.disk_utilization > 90
                  ? "text-red-600 font-bold"
                  : metric.disk_utilization > 80
                    ? "text-yellow-600"
                    : isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {metric.disk_utilization}%
            </span>
          </div>

          {/* CPU Temperature */}
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" />
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Temp:</span>
            <span
              className={`ml-auto font-mono ${
                metric.cpu_temp > 80
                  ? "text-red-600 font-bold"
                  : metric.cpu_temp > 70
                    ? "text-yellow-600"
                    : isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {metric.cpu_temp}°C
            </span>
          </div>

          {/* Power Consumption */}
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Power:</span>
            <span className={`ml-auto font-mono ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              {metric.power_consumption}W
            </span>
          </div>

          {/* Clock Speed */}
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Clock:</span>
            <span className={`ml-auto font-mono ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              {metric.clock_speed}GHz
            </span>
          </div>

          {/* IP Address */}
          <div className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            IP: {metric.ip_address}
          </div>

          {/* CPU Name */}
          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {metric.cpu_name}
          </div>

          {isFlagged && (
            <div className={`mt-2 p-2 border rounded text-xs ${
              isDarkMode 
                ? "bg-red-900/30 border-red-600 text-red-300" 
                : "bg-red-100 border-red-300 text-red-700"
            }`}>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-semibold">Failure risk detected</span>
              </div>
              <span className="text-xs">Click for detailed analysis</span>
            </div>
          )}
        </div>
      </LiquidGlass>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Unified Metrics Container */}
      <LiquidGlass 
        variant="card" 
        intensity="medium"
        isDarkMode={isDarkMode}
        className="p-6"
      >
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Server Metrics
          </h1>
          <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Real-time server performance monitoring
            {selectedEnvironment !== "All" && ` - ${selectedEnvironment}`}
            {selectedApp !== "All" && ` - ${selectedApp}`}
          </p>
        </div>

        {/* Unified Metrics Container */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
          {/* Total Servers */}
          <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            isDarkMode 
              ? "bg-gray-800/60 border-gray-600/40 hover:bg-gray-700/60" 
              : "bg-white/80 border-gray-200/40 hover:bg-white/90"
          }`}>
            <div className="flex items-start">
              <Server className="w-8 h-8 text-blue-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Total Servers
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {serverStats.totalServers}
                </p>
                <p className="text-xs text-gray-500">Monitored</p>
              </div>
            </div>
          </div>

          {/* Healthy Servers */}
          <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            isDarkMode 
              ? "bg-gray-800/60 border-gray-600/40 hover:bg-gray-700/60" 
              : "bg-white/80 border-gray-200/40 hover:bg-white/90"
          }`}>
            <div className="flex items-start">
              <CheckCircle className="w-8 h-8 text-green-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Healthy
                </p>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  {serverStats.healthyServers}
                </p>
                <p className="text-xs text-gray-500">Servers</p>
              </div>
            </div>
          </div>

          {/* Critical Servers */}
          <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            isDarkMode 
              ? "bg-gray-800/60 border-gray-600/40 hover:bg-gray-700/60" 
              : "bg-white/80 border-gray-200/40 hover:bg-white/90"
          }`}>
            <div className="flex items-start">
              <AlertTriangle className="w-8 h-8 text-red-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Critical
                </p>
                <p className="text-2xl font-bold text-red-600 mb-1">
                  {serverStats.criticalServers}
                </p>
                <p className="text-xs text-gray-500">Servers</p>
              </div>
            </div>
          </div>

          {/* Average CPU Usage */}
          <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            isDarkMode 
              ? "bg-gray-800/60 border-gray-600/40 hover:bg-gray-700/60" 
              : "bg-white/80 border-gray-200/40 hover:bg-white/90"
          }`}>
            <div className="flex items-start">
              <Cpu className="w-8 h-8 text-purple-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Avg CPU Usage
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {serverStats.avgCpuUsage}%
                </p>
                <p className="text-xs text-gray-500">Average</p>
              </div>
            </div>
          </div>

          {/* Average Memory Usage */}
          <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            isDarkMode 
              ? "bg-gray-800/60 border-gray-600/40 hover:bg-gray-700/60" 
              : "bg-white/80 border-gray-200/40 hover:bg-white/90"
          }`}>
            <div className="flex items-start">
              <Activity className="w-8 h-8 text-orange-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Avg Memory
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {serverStats.avgMemoryUsage}%
                </p>
                <p className="text-xs text-gray-500">Average</p>
              </div>
            </div>
          </div>

          {/* Average Disk Usage */}
          <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            isDarkMode 
              ? "bg-gray-800/60 border-gray-600/40 hover:bg-gray-700/60" 
              : "bg-white/80 border-gray-200/40 hover:bg-white/90"
          }`}>
            <div className="flex items-start">
              <HardDrive className="w-8 h-8 text-indigo-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Avg Disk Usage
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {serverStats.avgDiskUsage}%
                </p>
                <p className="text-xs text-gray-500">Average</p>
              </div>
            </div>
          </div>
        </div>
      </LiquidGlass>

      {loading ? (
        <LiquidGlass 
          variant="card" 
          intensity="medium"
          isDarkMode={isDarkMode}
          className="p-12"
        >
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={`ml-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Loading server metrics...
            </span>
          </div>
        </LiquidGlass>
      ) : (
        <>
          {/* Server Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serverMetrics.map((metric, index) => (
              <ServerMetricCard key={`${metric.server}-${metric.environment}`} metric={metric} />
            ))}
          </div>

          {serverMetrics.length === 0 && (
            <LiquidGlass 
              variant="card" 
              intensity="medium"
              isDarkMode={isDarkMode}
              className="p-12"
            >
              <div className="text-center">
                <Server className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  No servers found
                </h3>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  No servers match the current environment and application filters.
                </p>
              </div>
            </LiquidGlass>
          )}
        </>
      )}

      {/* Predictive Maintenance Analysis Modal */}
      {showLLMAnalysis && selectedServerForAnalysis && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleModalClick}
        >
          <LiquidGlass 
            variant="card" 
            intensity="strong"
            isDarkMode={isDarkMode}
            className="w-full max-w-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h3 className={`text-lg font-bold text-red-700 ${isDarkMode ? "text-red-400" : ""}`}>
                    Predictive Maintenance Analysis - {selectedServerForAnalysis}
                  </h3>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full flex items-center">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Predicted
                  </span>
                </div>
                <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                  <button 
                    onClick={closeModal} 
                    className={`p-2 rounded-md transition-colors ${
                      isDarkMode 
                        ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" 
                        : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </LiquidGlass>
              </div>

              {predictiveAnalysis ? (
                <div className="space-y-4">
                  <LiquidGlass 
                    variant="panel" 
                    intensity="subtle"
                    isDarkMode={isDarkMode}
                    className="p-4 border-l-4 border-red-400"
                  >
                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                      isDarkMode ? "text-red-400" : "text-red-700"
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                      Predicted Issue:
                    </h4>
                    <p className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-800"}`}>
                      {predictiveAnalysis.predicted_issue}
                    </p>
                  </LiquidGlass>

                  <LiquidGlass 
                    variant="panel" 
                    intensity="subtle"
                    isDarkMode={isDarkMode}
                    className="p-4 border-l-4 border-yellow-400"
                  >
                    <h4 className={`font-semibold mb-2 ${
                      isDarkMode ? "text-yellow-400" : "text-yellow-700"
                    }`}>
                      Preventive Actions:
                    </h4>
                    <ul className="list-disc ml-4 space-y-1">
                      {predictiveAnalysis.preventive_actions?.map((action, idx) => (
                        <li key={idx} className={`text-sm ${
                          isDarkMode ? "text-yellow-300" : "text-yellow-800"
                        }`}>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </LiquidGlass>

                  <LiquidGlass 
                    variant="panel" 
                    intensity="subtle"
                    isDarkMode={isDarkMode}
                    className="p-4 border-l-4 border-blue-400"
                  >
                    <h4 className={`font-semibold mb-2 ${
                      isDarkMode ? "text-blue-400" : "text-blue-700"
                    }`}>
                      Current State Summary:
                    </h4>
                    <p className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
                      {predictiveAnalysis.current_state_summary}
                    </p>
                  </LiquidGlass>

                  <div className={`flex items-center justify-between pt-3 border-t ${
                    isDarkMode ? "border-gray-600" : "border-gray-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Confidence:
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        predictiveAnalysis.confidence === "High" 
                          ? "bg-red-100 text-red-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {predictiveAnalysis.confidence}
                      </span>
                    </div>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Predicted: {new Date(predictiveAnalysis.prediction_timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    Loading predictive analysis...
                  </p>
                </div>
              )}
            </div>
          </LiquidGlass>
        </div>
      )}
    </div>
  )
}

export default ServerMetrics
