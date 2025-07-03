"use client"

import { useState, useEffect } from "react"
import { Activity, Wifi, Globe, RefreshCw, TrendingUp, TrendingDown, Zap, ChevronLeft, ChevronRight, AlertTriangle, Brain, X } from "lucide-react"
import { api } from "../api/client"
import LiquidGlass from "../components/LiquidGlass"

const NetworkMetrics = ({ selectedEnvironment, selectedApp, isDarkMode }) => {
  const [networkLogs, setNetworkLogs] = useState([])
  const [selectedPrediction, setSelectedPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [networkStats, setNetworkStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    totalBandwidth: 0,
    avgThroughput: 0,
  })
  const [attackPredictions, setAttackPredictions] = useState([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_count: 0,
    page_size: 10,
    has_next: false,
    has_prev: false,
    start_index: 0,
    end_index: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setCurrentPage(1)
    fetchNetworkMetrics(1, pageSize)
    fetchAttackPredictions()
  }, [selectedEnvironment, selectedApp])

  useEffect(() => {
    fetchNetworkMetrics(currentPage, pageSize)
  }, [currentPage, pageSize])

  const fetchNetworkMetrics = async (page = 1, limit = 10) => {
    try {
      setLoading(true)
      console.log("Fetching network metrics for:", selectedEnvironment, selectedApp, page, limit)
      
      const metrics = await api.getNetworkMetrics(selectedEnvironment, selectedApp, page, limit, null)
      console.log("Received network metrics:", metrics)
      
      setNetworkLogs(metrics.logs || [])
      setNetworkStats(metrics.stats || {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        totalBandwidth: 0,
        avgThroughput: 0,
      })
      setPagination(metrics.pagination || {
        current_page: 1,
        total_pages: 0,
        total_count: 0,
        page_size: limit,
        has_next: false,
        has_prev: false,
        start_index: 0,
        end_index: 0
      })
    } catch (error) {
      console.error("Failed to fetch network metrics:", error)
      
      setNetworkLogs([])
      setNetworkStats({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        totalBandwidth: 0,
        avgThroughput: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAttackPredictions = async () => {
    try {
      console.log("Fetching attack predictions for:", selectedEnvironment, selectedApp);
      const predictions = await api.getAttackPredictions(selectedEnvironment, selectedApp);
      console.log("✅ Received attack predictions:", predictions);
      setAttackPredictions(predictions.predictions || []);
    } catch (error) {
      console.error("❌ Failed to fetch attack predictions:", error);
      setAttackPredictions([]);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusColor = (status) => {
    return status === "Success" ? "text-green-600" : "text-red-600"
  }

  const getStatusBg = (status) => {
    return status === "Success" ? "bg-green-100" : "bg-red-100"
  }

  const getResponseTimeColor = (responseTime) => {
    if (responseTime > 1000) return "text-red-600"
    if (responseTime > 500) return "text-yellow-600"
    return "text-green-600"
  }

  const closeModal = () => {
    setSelectedPrediction(null)
  }

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal()
    }
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
            Network Metrics
          </h1>
          <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Network traffic and connectivity monitoring
            {selectedEnvironment !== "All" && ` - ${selectedEnvironment}`}
            {selectedApp !== "All" && ` - ${selectedApp}`}
          </p>
        </div>

        {/* Unified Metrics Container */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
          {/* Total Requests */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <Activity className="w-8 h-8 text-blue-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Total Requests
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {networkStats.totalRequests}
                </p>
                <p className="text-xs text-gray-500">Requests</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Successful Requests */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <TrendingUp className="w-8 h-8 text-green-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Successful
                </p>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  {networkStats.successfulRequests}
                </p>
                <p className="text-xs text-gray-500">Requests</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Failed Requests */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <TrendingDown className="w-8 h-8 text-red-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-600 mb-1">
                  {networkStats.failedRequests}
                </p>
                <p className="text-xs text-gray-500">Requests</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Average Latency */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <Wifi className="w-8 h-8 text-purple-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Avg Latency
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {networkStats.avgResponseTime}ms
                </p>
                <p className="text-xs text-gray-500">Average</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Total Bandwidth */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <Globe className="w-8 h-8 text-orange-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Total Bandwidth
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {formatBytes(networkStats.totalBandwidth)}
                </p>
                <p className="text-xs text-gray-500">Bandwidth</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Average Throughput */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <Zap className="w-8 h-8 text-indigo-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Avg Throughput
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {networkStats.avgThroughput} Mbps
                </p>
                <p className="text-xs text-gray-500">Throughput</p>
              </div>
            </div>
          </LiquidGlass>
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
              Loading network metrics...
            </span>
          </div>
        </LiquidGlass>
      ) : (
        <>
          {/* Predicted DDoS Attack Servers */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="overflow-hidden"
          >
            <div className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-600/40" : "border-gray-200/40"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Predicted DDoS Attack Servers
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center">
                        <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                        Generated by LLM
                      </span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      AI-powered analysis of servers with high likelihood of experiencing DDoS attacks ({attackPredictions.length} total)
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  attackPredictions.length > 0 
                    ? "bg-red-100 text-red-700" 
                    : "bg-green-100 text-green-700"
                }`}>
                  {attackPredictions.length > 0 ? `${attackPredictions.length} At Risk` : "All Clear"}
                </span>
              </div>
            </div>

            {attackPredictions.length > 0 ? (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`sticky top-0 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                        Server ID
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                        Prediction
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                        Confidence
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                        Predicted At
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-200 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                    {attackPredictions.map((prediction, index) => {
                      const serverName = prediction.server_name || "Unknown";
                      const environment = prediction.environment || "Unknown";
                      const envMapping = {
                        "Dev": "Development",
                        "Stage": "Staging",
                        "Prod": "Production",
                        "QA": "QA"
                      };
                      const displayEnv = envMapping[environment] || environment;
                      const serverId = `${displayEnv}-${serverName}`;
                      
                      const getConfidenceColor = (confidence) => {
                        if (typeof confidence === "number") {
                          if (confidence > 0.8) return "text-red-600 bg-red-100";
                          if (confidence > 0.6) return "text-yellow-600 bg-yellow-100";
                          return "text-green-600 bg-green-100";
                        } else {
                          const conf = confidence?.toLowerCase() || "";
                          if (conf === "high") return "text-red-600 bg-red-100";
                          if (conf === "medium") return "text-yellow-600 bg-yellow-100";
                          return "text-green-600 bg-green-100";
                        }
                      };
                      
                      const confidenceDisplay = typeof prediction.confidence === "number"
                        ? `${(prediction.confidence * 100).toFixed(1)}%`
                        : prediction.confidence || "N/A";
                        
                      return (
                        <tr 
                          key={index} 
                          className={`hover:${isDarkMode ? "bg-gray-700" : "bg-gray-50"} transition-colors cursor-pointer`}
                          onClick={() => setSelectedPrediction(prediction)}
                        >
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className={`w-3 h-3 rounded-full ${
                                  prediction.confidence === "High" || (typeof prediction.confidence === "number" && prediction.confidence > 0.8)
                                    ? "bg-red-500" 
                                    : prediction.confidence === "Medium" || (typeof prediction.confidence === "number" && prediction.confidence > 0.6)
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}></div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium">{serverId}</div>
                                <div className="text-xs text-gray-500">{serverName}</div>
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                            <div className="text-sm max-w-xs">
                              <div className="truncate" title={prediction.ddos_prediction}>
                                {prediction.ddos_prediction?.substring(0, 60)}
                                {prediction.ddos_prediction?.length > 60 ? "..." : ""}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(prediction.confidence)}`}>
                              {confidenceDisplay}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(prediction.prediction_timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                              At Risk
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  No DDoS Threats Detected
                </h3>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  All servers are currently operating normally with no predicted DDoS attacks.
                </p>
              </div>
            )}
          </LiquidGlass>

          {/* Network Logs Table */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="overflow-hidden"
          >
            <div className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-600/40" : "border-gray-200/40"}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Recent Network Activity
                </h3>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Showing {pagination.start_index}-{pagination.end_index} of {pagination.total_count} entries
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className={`px-2 py-1 border rounded text-sm ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white" 
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Timestamp
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Source → Destination
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Protocol/Port
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Latency
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Bytes Sent/Received
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Throughput
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Server/Env
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  {networkLogs.map((log) => (
                    <tr key={log.id} className={`hover:${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                        <div className="flex items-center">
                          <span className="font-mono text-xs">{log.source_ip}</span>
                          <span className="mx-2">→</span>
                          <span className="font-mono text-xs">{log.destination_ip}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                        <span className="font-mono text-xs">
                          {log.protocol_port || `${log.protocol}:${log.port}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBg(log.status)} ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                        <span className={`font-mono text-xs ${getResponseTimeColor(log.response_time)}`}>
                          {log.response_time.toFixed(2)}ms
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                        <div className="text-xs">
                          <div>↑ {formatBytes(log.bytes_sent)}</div>
                          <div>↓ {formatBytes(log.bytes_received)}</div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                        <span className="font-mono text-xs">
                          {log.throughput_mbps ? `${log.throughput_mbps.toFixed(2)} Mbps` : "N/A"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <div className="text-xs">
                          <div className="font-medium">{log.server}</div>
                          <div className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                            {log.environment}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
              <div className={`px-6 py-4 border-t ${isDarkMode ? "border-gray-600/40" : "border-gray-200/40"}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Page {pagination.current_page} of {pagination.total_pages}
                  </div>
                  <div className="flex items-center gap-2">
                    <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.has_prev}
                        className={`px-3 py-1 rounded transition-colors ${
                          pagination.has_prev
                            ? isDarkMode
                              ? "hover:bg-gray-700 text-gray-300"
                              : "hover:bg-gray-50 text-gray-700"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </LiquidGlass>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const page = Math.max(1, pagination.current_page - 2) + i
                      if (page <= pagination.total_pages) {
                        return (
                          <LiquidGlass key={page} variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 rounded transition-colors ${
                                page === pagination.current_page
                                  ? "bg-blue-600 text-white"
                                  : isDarkMode
                                    ? "hover:bg-gray-700 text-gray-300"
                                    : "hover:bg-gray-50 text-gray-700"
                              }`}
                            >
                              {page}
                            </button>
                          </LiquidGlass>
                        )
                      }
                      return null
                    })}
                    
                    <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.has_next}
                        className={`px-3 py-1 rounded transition-colors ${
                          pagination.has_next
                            ? isDarkMode
                              ? "hover:bg-gray-700 text-gray-300"
                              : "hover:bg-gray-50 text-gray-700"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </LiquidGlass>
                  </div>
                </div>
              </div>
            )}
          </LiquidGlass>

          {networkLogs.length === 0 && (
            <LiquidGlass 
              variant="card" 
              intensity="medium"
              isDarkMode={isDarkMode}
              className="p-12"
            >
              <div className="text-center">
                <Activity className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  No network activity found
                </h3>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  No network logs match the current filters.
                </p>
              </div>
            </LiquidGlass>
          )}
        </>
      )}

      {/* DDoS Prediction Detail Modal */}
      {selectedPrediction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleModalClick}
        >
          <LiquidGlass 
            variant="card" 
            intensity="strong"
            isDarkMode={isDarkMode}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    DDoS Attack Prediction Details
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Generated
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

              <div className="space-y-6">
                {/* Server Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Server ID:</strong> 
                    <span className="ml-2">{selectedPrediction.server_id || "N/A"}</span>
                  </div>
                  <div>
                    <strong>Server Name:</strong> 
                    <span className="ml-2">{selectedPrediction.server_name || "N/A"}</span>
                  </div>
                  <div>
                    <strong>Environment:</strong> 
                    <span className="ml-2">{selectedPrediction.environment || "N/A"}</span>
                  </div>
                  <div>
                    <strong>Confidence Level:</strong>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                      selectedPrediction.confidence === "High" ? "bg-red-100 text-red-700" :
                      selectedPrediction.confidence === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {selectedPrediction.confidence || "N/A"}
                    </span>
                  </div>
                  <div>
                    <strong>Prediction Time:</strong> 
                    <span className="ml-2">{new Date(selectedPrediction.prediction_timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <strong>Analysis ID:</strong> 
                    <span className="ml-2 font-mono text-xs">{selectedPrediction._id}</span>
                  </div>
                </div>

                {/* Full Prediction Text */}
                <LiquidGlass 
                  variant="panel" 
                  intensity="subtle"
                  isDarkMode={isDarkMode}
                  className="p-4 border-l-4 border-red-400"
                >
                  <strong>DDoS Attack Prediction:</strong>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">
                    {selectedPrediction.ddos_prediction}
                  </p>
                </LiquidGlass>

                {/* Analyzed Log IDs */}
                {selectedPrediction.analyzed_log_ids && selectedPrediction.analyzed_log_ids.length > 0 && (
                  <div>
                    <strong>Analyzed Log Entries ({selectedPrediction.analyzed_log_ids.length}):</strong>
                    <LiquidGlass 
                      variant="panel" 
                      intensity="subtle"
                      isDarkMode={isDarkMode}
                      className="p-3 mt-2"
                    >
                      <div className="flex flex-wrap gap-2">
                        {selectedPrediction.analyzed_log_ids.slice(0, 10).map((logId, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono"
                          >
                            {logId}
                          </span>
                        ))}
                        {selectedPrediction.analyzed_log_ids.length > 10 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                            +{selectedPrediction.analyzed_log_ids.length - 10} more
                          </span>
                        )}
                      </div>
                    </LiquidGlass>
                  </div>
                )}

                {/* Recommended Actions */}
                <LiquidGlass 
                  variant="panel" 
                  intensity="subtle"
                  isDarkMode={isDarkMode}
                  className="p-4 border-l-4 border-yellow-400"
                >
                  <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                    isDarkMode ? "text-yellow-400" : "text-yellow-700"
                  }`}>
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Recommended Actions:
                  </h4>
                  <ul className={`text-sm space-y-1 ${
                    isDarkMode ? "text-yellow-300" : "text-yellow-800"
                  }`}>
                    <li>• Monitor network traffic closely for unusual patterns</li>
                    <li>• Review and update DDoS protection configurations</li>
                    <li>• Ensure backup systems are ready for failover</li>
                    <li>• Consider implementing rate limiting if not already in place</li>
                    <li>• Alert security team for enhanced monitoring</li>
                  </ul>
                </LiquidGlass>

                {/* Close Button */}
                <div className={`flex justify-end pt-4 border-t ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}>
                  <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                    <button
                      onClick={closeModal}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        isDarkMode 
                          ? "bg-gray-600 hover:bg-gray-700 text-white" 
                          : "bg-gray-600 hover:bg-gray-700 text-white"
                      }`}
                    >
                      Close
                    </button>
                  </LiquidGlass>
                </div>
              </div>
            </div>
          </LiquidGlass>
        </div>
      )}
    </div>
  )
}

export default NetworkMetrics