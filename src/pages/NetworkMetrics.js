"use client"

import { useState, useEffect } from "react"
import { Activity, Wifi, Globe, RefreshCw, TrendingUp, TrendingDown, Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { api } from "../api/client"

const NetworkMetrics = ({ selectedEnvironment, selectedApp, isDarkMode }) => {
  const [networkLogs, setNetworkLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [networkStats, setNetworkStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    totalBandwidth: 0,
    avgThroughput: 0,
  })
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
    setCurrentPage(1) // Reset to first page when filters change
    fetchNetworkMetrics(1, pageSize)
  }, [selectedEnvironment, selectedApp])

  useEffect(() => {
    fetchNetworkMetrics(currentPage, pageSize)
  }, [currentPage, pageSize])

  const fetchNetworkMetrics = async (page = 1, limit = 10) => {
    try {
      setLoading(true)
      console.log("Fetching network metrics for:", selectedEnvironment, selectedApp, page, limit)
      
      // Use only selectedEnvironment and selectedApp - no server filter
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
      
      // Clear data on error
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1) // Reset to first page when changing page size
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Metrics</h1>
          <p className="text-gray-600">
            Network traffic and connectivity monitoring
            {selectedEnvironment !== "All" && ` - ${selectedEnvironment}`}
            {selectedApp !== "All" && ` - ${selectedApp}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchNetworkMetrics(currentPage, pageSize)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading network metrics...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Total Requests
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {networkStats.totalRequests}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Successful</p>
                  <p className="text-2xl font-bold text-green-600">{networkStats.successfulRequests}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <TrendingDown className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Failed</p>
                  <p className="text-2xl font-bold text-red-600">{networkStats.failedRequests}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <Wifi className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Avg Latency
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {networkStats.avgResponseTime}ms
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <Globe className="w-8 h-8 text-orange-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Total Bandwidth</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatBytes(networkStats.totalBandwidth)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <Zap className="w-8 h-8 text-indigo-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Avg Throughput</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {networkStats.avgThroughput} Mbps
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Network Logs Table */}
          <div className={`rounded-lg shadow overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
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
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
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
              <div className={`px-6 py-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Page {pagination.current_page} of {pagination.total_pages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.has_prev}
                      className={`px-3 py-1 rounded border ${
                        pagination.has_prev
                          ? "border-gray-300 hover:bg-gray-50"
                          : "border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const page = Math.max(1, pagination.current_page - 2) + i
                      if (page <= pagination.total_pages) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded border ${
                              page === pagination.current_page
                                ? "bg-blue-600 text-white border-blue-600"
                                : "border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      }
                      return null
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.has_next}
                      className={`px-3 py-1 rounded border ${
                        pagination.has_next
                          ? "border-gray-300 hover:bg-gray-50"
                          : "border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {networkLogs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No network activity found</h3>
              <p className="text-gray-600">No network logs match the current filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NetworkMetrics
