"use client"

import { useState, useEffect } from "react"
import { FileText, Search, Filter, RefreshCw, AlertTriangle, Info, CheckCircle, Brain, Loader2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react"
import { api } from "../api/client"

const AppLogs = ({ selectedEnvironment, selectedApp, isDarkMode }) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [logStats, setLogStats] = useState({
    totalLogs: 0,
    errorLogs: 0,
    warningLogs: 0,
    infoLogs: 0,
    criticalLogs: 0,
    recentErrors: 0
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
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [selectedLog, setSelectedLog] = useState(null)
  const [llmAnalysis, setLlmAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)

  useEffect(() => {
    setCurrentPage(1)
    fetchLogs(1, pageSize)
  }, [selectedEnvironment, selectedApp])

  useEffect(() => {
    fetchLogs(currentPage, pageSize)
  }, [currentPage, pageSize])

  const fetchLogs = async (page = 1, limit = 10) => {
    try {
      setLoading(true)
      console.log("Fetching app logs for:", selectedEnvironment, selectedApp, page, limit)
      
      const logsData = await api.getAppLogs(selectedEnvironment, selectedApp, page, limit, {})
      
      console.log("Received app logs:", logsData)
      
      setLogs(logsData.logs || [])
      setLogStats(logsData.stats || {
        totalLogs: 0,
        errorLogs: 0,
        warningLogs: 0,
        infoLogs: 0,
        criticalLogs: 0,
        recentErrors: 0
      })
      setPagination(logsData.pagination || {
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
      console.error("Failed to fetch logs:", error)
      setLogs([])
      setLogStats({
        totalLogs: 0,
        errorLogs: 0,
        warningLogs: 0,
        infoLogs: 0,
        criticalLogs: 0,
        recentErrors: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.logger && log.logger.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter
    return matchesSearch && matchesLevel
  })

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const fetchLLMAnalysis = async (logId) => {
    try {
      setAnalysisLoading(true)
      setAnalysisError(null)
      console.log("Fetching analysis for log ID:", logId)
      const analysis = await api.getLLMAnalysis(logId)
      console.log("Received analysis:", analysis)
      setLlmAnalysis(analysis)
    } catch (error) {
      console.error("Failed to fetch LLM analysis:", error)
      setAnalysisError("No analysis available for this log")
      setLlmAnalysis(null)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const generateLLMAnalysis = async (log) => {
    try {
      setAnalysisLoading(true)
      setAnalysisError(null)
      const analysis = await api.generateLLMAnalysis({
        log_id: log._id,
        message: log.message,
        level: log.level,
        logger: log.logger,
        environment: log.environment,
        server: log.server,
        app_name: log.app_name
      })
      setLlmAnalysis(analysis)
    } catch (error) {
      console.error("Failed to generate LLM analysis:", error)
      setAnalysisError("Failed to generate analysis")
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleLogSelect = (log) => {
    setSelectedLog(log)
    setLlmAnalysis(null)
    setAnalysisError(null)
    fetchLLMAnalysis(log._id)
  }

  const getLevelIcon = (level) => {
    switch (level) {
      case "ERROR":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "INFO":
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "ERROR":
        return "border-red-500 bg-red-50"
      case "WARNING":
        return "border-yellow-500 bg-yellow-50"
      case "INFO":
        return "border-blue-500 bg-blue-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case "ERROR":
        return "bg-red-100 text-red-700"
      case "WARNING":
        return "bg-yellow-100 text-yellow-700"
      case "INFO":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Logs</h1>
          <p className="text-gray-600">
            Real-time application logging and error tracking
            {selectedEnvironment !== "All" && ` - ${selectedEnvironment}`}
            {selectedApp !== "All" && ` - ${selectedApp}`}
          </p>
        </div>
        <button
          onClick={() => fetchLogs(currentPage, pageSize)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading application logs...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Total Logs
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {logStats.totalLogs}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Errors</p>
                  <p className="text-2xl font-bold text-red-600">{logStats.errorLogs}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <TrendingDown className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{logStats.warningLogs}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <Info className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Info Logs
                  </p>
                  <p className="text-2xl font-bold text-green-600">{logStats.infoLogs}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <Brain className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Critical</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {logStats.criticalLogs}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-500" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Recent Errors</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {logStats.recentErrors}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Levels</option>
                  <option value="ERROR">Error</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className={`rounded-lg shadow overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Application Logs
                </h3>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Showing {filteredLogs.length} of {logs.length} entries
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

            {/* Logs Display */}
            <div className="space-y-4 p-4">
              {filteredLogs.map((log) => (
                <div
                  key={log._id}
                  className={`rounded-lg shadow border-l-4 p-4 cursor-pointer hover:shadow-md transition-all duration-300 ${getLevelColor(log.level)} ${isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"}`}
                  onClick={() => handleLogSelect(log)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-gray-500">
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getLevelBadgeColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-xs text-gray-600">{log.logger}</span>
                    <span className="text-xs text-blue-600">{log.environment}</span>
                    <span className="text-xs text-green-600">{log.app_name}</span>
                    <span className="text-xs text-purple-600">{log.server}</span>
                  </div>
                  <div className="text-sm text-gray-900">{log.message}</div>
                  {log.exception_type && (
                    <div className="mt-2 text-xs text-red-700">
                      <strong>{log.exception_type}:</strong> {log.exception_message}
                    </div>
                  )}
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                  <p className="text-gray-600">No logs match the current filters and search criteria.</p>
                </div>
              )}
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
        </>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className={`rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Timestamp:</strong> {new Date(selectedLog.timestamp || selectedLog.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Level:</strong>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getLevelBadgeColor(selectedLog.level)}`}
                  >
                    {selectedLog.level}
                  </span>
                </div>
                <div>
                  <strong>Logger:</strong> {selectedLog.logger}
                </div>
                <div>
                  <strong>Environment:</strong> {selectedLog.environment}
                </div>
                <div>
                  <strong>Server:</strong> {selectedLog.server}
                </div>
                <div>
                  <strong>Application:</strong> {selectedLog.app_name}
                </div>
                {selectedLog.path && (
                  <div className="col-span-2">
                    <strong>Path:</strong> {selectedLog.path}
                  </div>
                )}
              </div>

              <div>
                <strong>Message:</strong>
                <div className="mt-1 p-3 bg-gray-100 rounded text-sm">{selectedLog.message}</div>
              </div>

              {selectedLog.exception_type && (
                <div>
                  <strong>Exception:</strong>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <div>
                      <strong>Type:</strong> {selectedLog.exception_type}
                    </div>
                    <div>
                      <strong>Message:</strong> {selectedLog.exception_message}
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.stacktrace && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                    {selectedLog.stacktrace}
                  </pre>
                </div>
              )}

              {/* LLM Analysis Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <strong className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Brain className="w-3 h-3 text-white" />
                      </div>
                      LLM Analysis
                    </strong>
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center">
                      <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                      AI Powered
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fetchLLMAnalysis(selectedLog._id)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      disabled={analysisLoading}
                    >
                      {analysisLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
                    </button>
                    <button 
                      onClick={() => generateLLMAnalysis(selectedLog)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      disabled={analysisLoading}
                    >
                      Generate New
                    </button>
                  </div>
                </div>

                {analysisLoading ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                      <span className="text-blue-600">Analyzing log with AI...</span>
                    </div>
                  </div>
                ) : analysisError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-700 text-sm">{analysisError}</div>
                    <button 
                      onClick={() => generateLLMAnalysis(selectedLog)}
                      className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Generate Analysis
                    </button>
                  </div>
                ) : llmAnalysis ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Root Cause Analysis:
                        </h4>
                        <div className="bg-white p-3 rounded border-l-4 border-red-400">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {llmAnalysis.issue}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          Impact Assessment:
                        </h4>
                        <div className="bg-white p-3 rounded border-l-4 border-yellow-400">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {llmAnalysis.impact}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Recommended Actions:
                        </h4>
                        <div className="bg-white p-3 rounded border-l-4 border-green-400">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {llmAnalysis.resolution}
                          </p>
                        </div>
                      </div>

                      {llmAnalysis.commands && llmAnalysis.commands.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Commands:</h4>
                          <div className="space-y-2">
                            {llmAnalysis.commands.map((command, index) => (
                              <div key={index} className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                                <span className="text-gray-500">$ </span>{command}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {llmAnalysis.original_log && (
                        <div className="border-t border-gray-200 pt-3">
                          <h4 className="font-medium text-gray-600 text-xs mb-2">Analysis Generated For:</h4>
                          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                            Log ID: {llmAnalysis.original_log_id}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-center py-4">
                      <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm mb-3">No LLM analysis available for this log</p>
                      <button 
                        onClick={() => generateLLMAnalysis(selectedLog)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                      >
                        Generate AI Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppLogs
