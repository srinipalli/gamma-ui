"use client"

import { useState, useEffect } from "react"
import { Activity, Wifi, Globe, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
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
  })

  useEffect(() => {
    fetchNetworkMetrics()
  }, [selectedEnvironment, selectedApp])

  const fetchNetworkMetrics = async () => {
    try {
      setLoading(true)
      const metrics = await api.getNetworkMetrics(selectedEnvironment, selectedApp)
      setNetworkLogs(metrics.logs)
      setNetworkStats(metrics.stats)
    } catch (error) {
      console.error("Failed to fetch network metrics:", error)
      // Fallback to mock data
      const mockLogs = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          source_ip: "192.168.1.100",
          destination_ip: "10.0.0.50",
          protocol: "HTTP",
          port: 80,
          bytes_transferred: 1024,
          status: "Success",
          response_time: 120,
          environment: "Production",
          app_name: "app1",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 60000).toISOString(),
          source_ip: "192.168.1.101",
          destination_ip: "10.0.0.51",
          protocol: "HTTPS",
          port: 443,
          bytes_transferred: 2048,
          status: "Failed",
          response_time: 5000,
          environment: "Production",
          app_name: "app2",
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 120000).toISOString(),
          source_ip: "192.168.1.102",
          destination_ip: "10.0.0.52",
          protocol: "TCP",
          port: 8080,
          bytes_transferred: 512,
          status: "Success",
          response_time: 80,
          environment: "Staging",
          app_name: "app1",
        },
      ]

      let filteredLogs = mockLogs
      if (selectedEnvironment !== "All") {
        filteredLogs = filteredLogs.filter((log) => log.environment === selectedEnvironment)
      }
      if (selectedApp !== "All") {
        filteredLogs = filteredLogs.filter((log) => log.app_name === selectedApp)
      }

      const totalRequests = filteredLogs.length
      const successfulRequests = filteredLogs.filter((log) => log.status === "Success").length
      const failedRequests = totalRequests - successfulRequests
      const avgResponseTime = filteredLogs.reduce((sum, log) => sum + log.response_time, 0) / totalRequests || 0
      const totalBandwidth = filteredLogs.reduce((sum, log) => sum + log.bytes_transferred, 0)

      setNetworkLogs(filteredLogs)
      setNetworkStats({
        totalRequests,
        successfulRequests,
        failedRequests,
        avgResponseTime: Math.round(avgResponseTime),
        totalBandwidth,
      })
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Metrics</h1>
          <p className="text-gray-600">Network traffic and connectivity monitoring</p>
        </div>
        <button
          onClick={fetchNetworkMetrics}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading network metrics...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div
              className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white"
              }`}
            >
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

            <div
              className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white"
              }`}
            >
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Successful</p>
                  <p className="text-2xl font-bold text-green-600">{networkStats.successfulRequests}</p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white"
              }`}
            >
              <div className="flex items-center">
                <TrendingDown className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Failed</p>
                  <p className="text-2xl font-bold text-red-600">{networkStats.failedRequests}</p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white"
              }`}
            >
              <div className="flex items-center">
                <Wifi className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Avg Response
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {networkStats.avgResponseTime}ms
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white"
              }`}
            >
              <div className="flex items-center">
                <Globe className="w-8 h-8 text-orange-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Bandwidth</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatBytes(networkStats.totalBandwidth)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-lg shadow overflow-hidden transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Recent Network Activity
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source → Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocol/Port
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bytes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Environment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {networkLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="font-mono">{log.source_ip}</span>
                          <span className="mx-2">→</span>
                          <span className="font-mono">{log.destination_ip}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-mono">
                          {log.protocol}:{log.port}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBg(
                            log.status,
                          )} ${getStatusColor(log.status)}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`font-mono ${
                            log.response_time > 1000
                              ? "text-red-600"
                              : log.response_time > 500
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {log.response_time}ms
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBytes(log.bytes_transferred)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                          {log.environment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {networkLogs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No network activity found</h3>
              <p className="text-gray-600">No network logs match the current environment and application filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NetworkMetrics
