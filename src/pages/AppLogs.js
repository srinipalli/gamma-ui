"use client"

import { useState, useEffect } from "react"
import { FileText, Search, Filter, RefreshCw, AlertTriangle, Info, CheckCircle, Brain, Loader2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, X } from "lucide-react"
import { api } from "../api/client"
import LiquidGlass from "../components/LiquidGlass"

const AppLogs = ({ selectedEnvironment, selectedApp, isDarkMode }) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [logStats, setLogStats] = useState({
    totalLogs: 0,
    errorLogs: 0,
    warningLogs: 0,
    infoLogs: 0,
    criticalLogs: 0,
    recentErrors: 0,
    llmAnalyzedLogs: 0 // Initialize llmAnalyzedLogs
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
    fetchLogStats(selectedEnvironment, selectedApp); // Fetch and update stats, including LLM analyzed count
  }, [selectedEnvironment, selectedApp])

  useEffect(() => {
    fetchLogs(currentPage, pageSize)
  }, [currentPage, pageSize])

  const fetchLogStats = async (environment, app) => {
    try {
      const llmCount = await getLLMAnalyzedCount(environment, app);
      setLogStats(prevStats => ({
        ...prevStats,
        llmAnalyzedLogs: llmCount
      }));
    } catch (error) {
      console.error("Failed to fetch LLM analyzed count for stats:", error);
    }
  };

  const fetchLogs = async (page = 1, limit = 10) => {
    try {
      setLoading(true)
      console.log("Fetching app logs for:", selectedEnvironment, selectedApp, page, limit)
      
      const logsData = await api.getAppLogs(selectedEnvironment, selectedApp, page, limit, {})
      
      console.log("Received app logs:", logsData)
      
      setLogs(logsData.logs || [])
      // Update logStats from logsData, and importantly, ensure llmAnalyzedLogs is carried over or updated
      setLogStats(prevStats => ({
        ...logsData.stats || {
          totalLogs: 0,
          errorLogs: 0,
          warningLogs: 0,
          infoLogs: 0,
          criticalLogs: 0,
          recentErrors: 0
        },
        llmAnalyzedLogs: prevStats.llmAnalyzedLogs // Preserve llmAnalyzedLogs from previous state or update if logsData provides it
      }));

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
      setLogStats(prevStats => ({
        totalLogs: 0,
        errorLogs: 0,
        warningLogs: 0,
        infoLogs: 0,
        criticalLogs: 0,
        recentErrors: 0,
        llmAnalyzedLogs: prevStats.llmAnalyzedLogs // Preserve LLM analyzed count on error
      }))
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

  const getLLMAnalyzedCount = async (environment, app) => {
    try {
      // Assuming api.getLogsWithAnalysis returns an object with logs_with_analysis
      const response = await api.getLogsWithAnalysis(environment, app);
      return response.logs_with_analysis || 0;
    } catch (error) {
      console.error("Failed to get LLM analyzed count:", error);
      return 0;
    }
  };


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
      // After successfully fetching analysis, re-fetch stats to update LLM analyzed count
      fetchLogStats(selectedEnvironment, selectedApp); 
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
      // After successfully generating analysis, re-fetch stats to update LLM analyzed count
      fetchLogStats(selectedEnvironment, selectedApp); 
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

  const closeModal = () => {
    setSelectedLog(null)
    setLlmAnalysis(null)
    setAnalysisError(null)
  }

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal()
    }
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
      {/* Header with Unified Metrics Container */}
      <LiquidGlass 
        variant="card" 
        intensity="medium"
        isDarkMode={isDarkMode}
        className="p-6"
      >
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Application Logs
          </h1>
          <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Real-time application logging and error tracking
            {selectedEnvironment !== "All" && ` - ${selectedEnvironment}`}
            {selectedApp !== "All" && ` - ${selectedApp}`}
          </p>
        </div>

        {/* Unified Metrics Container */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
          {/* Total Logs */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <FileText className="w-8 h-8 text-blue-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Total Logs
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {logStats.totalLogs}
                </p>
                <p className="text-xs text-gray-500">Logs</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Error Logs */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <AlertTriangle className="w-8 h-8 text-red-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Errors
                </p>
                <p className="text-2xl font-bold text-red-600 mb-1">
                  {logStats.errorLogs}
                </p>
                <p className="text-xs text-gray-500">Error Logs</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Warning Logs */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <TrendingDown className="w-8 h-8 text-yellow-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Warnings
                </p>
                <p className="text-2xl font-bold text-yellow-600 mb-1">
                  {logStats.warningLogs}
                </p>
                <p className="text-xs text-gray-500">Warning Logs</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Info Logs */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <Info className="w-8 h-8 text-green-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Info Logs
                </p>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  {logStats.infoLogs}
                </p>
                <p className="text-xs text-gray-500">Info Logs</p>
              </div>
            </div>
          </LiquidGlass>

          {/* LLM Analysed Logs */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <Brain className="w-8 h-8 text-purple-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  LLM Analysed
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {logStats.llmAnalyzedLogs}
                </p>
                <p className="text-xs text-gray-500">Analysed Logs</p>
              </div>
            </div>
          </LiquidGlass>

          {/* Recent Errors */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start">
              <TrendingUp className="w-8 h-8 text-orange-500 mt-1" />
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>
                  Recent Errors
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>
                  {logStats.recentErrors}
                </p>
                <p className="text-xs text-gray-500">Recent</p>
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
              Loading application logs...
            </span>
          </div>
        </LiquidGlass>
      ) : (
        <>
          {/* Search and Filter */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="p-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className={`border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="ALL">All Levels</option>
                  <option value="ERROR">Error</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </LiquidGlass>

          {/* Logs Table */}
          <LiquidGlass 
            variant="card" 
            intensity="medium"
            isDarkMode={isDarkMode}
            className="overflow-hidden"
          >
            <div className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-600/40" : "border-gray-200/40"}`}>
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

            {/* Logs Display */}
            <div className="space-y-4 p-4">
              {filteredLogs.map((log) => (
                <LiquidGlass
                  key={log._id}
                  variant="card"
                  intensity="subtle"
                  isDarkMode={isDarkMode}
                  className={`p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] border-l-4 ${
                    log.level === "ERROR" ? "border-l-red-500" :
                    log.level === "WARNING" ? "border-l-yellow-500" :
                    log.level === "INFO" ? "border-l-blue-500" :
                    "border-l-gray-300"
                  }`}
                  onClick={() => handleLogSelect(log)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-mono text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getLevelBadgeColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{log.logger}</span>
                    <span className="text-xs text-blue-600">{log.environment}</span>
                    <span className="text-xs text-green-600">{log.app_name}</span>
                    <span className="text-xs text-purple-600">{log.server}</span>
                  </div>
                  <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>{log.message}</div>
                  {log.exception_type && (
                    <div className="mt-2 text-xs text-red-700">
                      <strong>{log.exception_type}:</strong> {log.exception_message}
                    </div>
                  )}
                </LiquidGlass>
              ))}

              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <FileText className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                  <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    No logs found
                  </h3>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    No logs match the current filters and search criteria.
                  </p>
                </div>
              )}
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
        </>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
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
                <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Log Details
                </h3>
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
                  <LiquidGlass 
                    variant="panel" 
                    intensity="subtle"
                    isDarkMode={isDarkMode}
                    className="mt-1 p-3"
                  >
                    <div className="text-sm">{selectedLog.message}</div>
                  </LiquidGlass>
                </div>

                {selectedLog.exception_type && (
                  <div>
                    <strong>Exception:</strong>
                    <LiquidGlass 
                      variant="panel" 
                      intensity="subtle"
                      isDarkMode={isDarkMode}
                      className="mt-1 p-3 border-l-4 border-red-400"
                    >
                      <div className="text-sm">
                        <div>
                          <strong>Type:</strong> {selectedLog.exception_type}
                        </div>
                        <div>
                          <strong>Message:</strong> {selectedLog.exception_message}
                        </div>
                      </div>
                    </LiquidGlass>
                  </div>
                )}

                {selectedLog.stacktrace && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <LiquidGlass 
                      variant="panel" 
                      intensity="subtle"
                      isDarkMode={isDarkMode}
                      className="mt-1 p-3"
                    >
                      <pre className={`text-xs overflow-x-auto ${
                        isDarkMode ? "text-green-400" : "text-gray-800"
                      }`}>
                        {selectedLog.stacktrace}
                      </pre>
                    </LiquidGlass>
                  </div>
                )}

                {/* LLM Analysis Section */}
                <div className={`border-t pt-4 ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}>
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
                      <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                        <button 
                          onClick={() => fetchLLMAnalysis(selectedLog._id)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            isDarkMode 
                              ? "bg-blue-900/50 hover:bg-blue-800/50 text-blue-300" 
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                          disabled={analysisLoading}
                        >
                          {analysisLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
                        </button>
                      </LiquidGlass>
                      <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                        <button 
                          onClick={() => generateLLMAnalysis(selectedLog)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            isDarkMode 
                              ? "bg-green-900/50 hover:bg-green-800/50 text-green-300" 
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                          disabled={analysisLoading}
                        >
                          Generate New
                        </button>
                      </LiquidGlass>
                    </div>
                  </div>

                  {analysisLoading ? (
                    <LiquidGlass 
                      variant="panel" 
                      intensity="subtle"
                      isDarkMode={isDarkMode}
                      className="p-4"
                    >
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                        <span className="text-blue-600">Analyzing log with AI...</span>
                      </div>
                    </LiquidGlass>
                  ) : analysisError ? (
                    <LiquidGlass 
                      variant="panel" 
                      intensity="subtle"
                      isDarkMode={isDarkMode}
                      className="p-4 border-l-4 border-red-400"
                    >
                      <div className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-700"}`}>{analysisError}</div>
                      <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                        <button 
                          onClick={() => generateLLMAnalysis(selectedLog)}
                          className={`mt-2 px-3 py-1 text-xs rounded-md transition-colors ${
                            isDarkMode 
                              ? "bg-red-900/50 hover:bg-red-800/50 text-red-300" 
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          Generate Analysis
                        </button>
                      </LiquidGlass>
                    </LiquidGlass>
                  ) : llmAnalysis ? (
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
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Root Cause Analysis:
                        </h4>
                        <p className={`text-sm leading-relaxed ${
                          isDarkMode ? "text-red-300" : "text-red-800"
                        }`}>
                          {llmAnalysis.issue}
                        </p>
                      </LiquidGlass>

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
                          Impact Assessment:
                        </h4>
                        <p className={`text-sm leading-relaxed ${
                          isDarkMode ? "text-yellow-300" : "text-yellow-800"
                        }`}>
                          {llmAnalysis.impact}
                        </p>
                      </LiquidGlass>

                      <LiquidGlass 
                        variant="panel" 
                        intensity="subtle"
                        isDarkMode={isDarkMode}
                        className="p-4 border-l-4 border-green-400"
                      >
                        <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                          isDarkMode ? "text-green-400" : "text-green-700"
                        }`}>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Recommended Actions:
                        </h4>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          isDarkMode ? "text-green-300" : "text-green-800"
                        }`}>
                          {llmAnalysis.resolution}
                        </p>
                      </LiquidGlass>

                      {llmAnalysis.commands && llmAnalysis.commands.length > 0 && (
                        <div>
                          <h4 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Commands:</h4>
                          <div className="space-y-2">
                            {llmAnalysis.commands.map((command, index) => (
                              <LiquidGlass 
                                key={index}
                                variant="panel" 
                                intensity="subtle"
                                isDarkMode={isDarkMode}
                                className="p-3"
                              >
                                <div className={`font-mono text-sm ${
                                  isDarkMode ? "text-green-400" : "text-gray-800"
                                }`}>
                                  <span className="text-gray-500">$ </span>{command}
                                </div>
                              </LiquidGlass>
                            ))}
                          </div>
                        </div>
                      )}

                      {llmAnalysis.original_log && (
                        <div className={`border-t pt-3 ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}>
                          <h4 className={`font-medium text-xs mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            Analysis Generated For:
                          </h4>
                          <LiquidGlass 
                            variant="panel" 
                            intensity="subtle"
                            isDarkMode={isDarkMode}
                            className="p-2"
                          >
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Log ID: {llmAnalysis.original_log_id}
                            </div>
                          </LiquidGlass>
                        </div>
                      )}
                    </div>
                  ) : (
                    <LiquidGlass 
                      variant="panel" 
                      intensity="subtle"
                      isDarkMode={isDarkMode}
                      className="p-4"
                    >
                      <div className="text-center py-4">
                        <Brain className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                        <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          No LLM analysis available for this log
                        </p>
                        <LiquidGlass variant="button" intensity="subtle" isDarkMode={isDarkMode}>
                          <button 
                            onClick={() => generateLLMAnalysis(selectedLog)}
                            className={`px-4 py-2 rounded-md transition-colors text-sm ${
                              isDarkMode 
                                ? "bg-blue-900/50 hover:bg-blue-800/50 text-blue-300" 
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                          >
                            Generate AI Analysis
                          </button>
                        </LiquidGlass>
                      </div>
                    </LiquidGlass>
                  )}
                </div>
              </div>
            </div>
          </LiquidGlass>
        </div>
      )}
    </div>
  )
}

export default AppLogs