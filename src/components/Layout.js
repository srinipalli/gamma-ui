"use client"

import { useState, useEffect } from "react"
import {
  Menu,
  Bell,
  User,
  TrendingUp,
  BarChart3,
  Activity,
  FileText,
  Sun,
  Moon,
  X,
  Search,
} from "lucide-react"
import { api } from "../api/client"
import ChatBot from "../components/ChatBot"

const Layout = ({
  children,
  selectedEnvironment,
  selectedApp,
  onOpenSelector,
  currentPage,
  onPageChange,
  isDarkMode,
  setIsDarkMode,
}) => {
  const [alerts, setAlerts] = useState([])
  const [activeAlerts, setActiveAlerts] = useState([])
  const [showAlertsPopup, setShowAlertsPopup] = useState(false)
  const [showFullAlertsModal, setShowFullAlertsModal] = useState(false)
  const [alertSearchTerm, setAlertSearchTerm] = useState("")
  const [alertTypeFilter, setAlertTypeFilter] = useState("all")
  const [alertTimeFilter, setAlertTimeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [selectedEnvironment, selectedApp])

  useEffect(() => {
    const fetchActiveAlerts = async () => {
      try {
        const alertsData = await api.getActiveAlerts()
        setActiveAlerts(alertsData || [])
        console.log("Fetched active alerts:", alertsData)
      } catch (error) {
        console.error("Failed to fetch active alerts:", error)
        setActiveAlerts([])
      }
    }

    fetchActiveAlerts()
    const interval = setInterval(fetchActiveAlerts, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching alerts for environment:", selectedEnvironment)
      
      const alertsData = await api.getActiveAlerts(selectedEnvironment !== "All" ? selectedEnvironment : null)
      console.log("Raw alerts data received:", alertsData)
      
      if (!Array.isArray(alertsData)) {
        console.error("alertsData is not an array:", alertsData)
        throw new Error("Invalid data format received")
      }
      
      const transformedAlerts = alertsData.map(alert => ({
        type: alert.severity === "critical" ? "error" : alert.severity === "warning" ? "warning" : "info",
        title: alert.alertname || alert.summary || "Unknown Alert",
        message: alert.description || alert.summary || "No description",
        server_name: alert.server_name,
        environment: alert.environment,
        startsAt: alert.startsAt,
        id: alert.id
      }))
      
      console.log("Transformed alerts:", transformedAlerts)
      setAlerts(transformedAlerts)
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
      
      setAlerts([
        { type: "error", title: "High CPU Usage", message: "Server 1 CPU usage is above 90%" },
        { type: "warning", title: "Memory Warning", message: "Server 3 memory usage is above 80%" },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const alertsToDisplay = activeAlerts.filter(alert => {
    const envMapping = {
      "Production": "Prod",
      "Development": "Dev", 
      "Staging": "Stage",
      "QA": "QA"
    }
    
    const dbEnv = envMapping[selectedEnvironment] || selectedEnvironment
    const matchesEnv = selectedEnvironment === 'All' || alert.environment === dbEnv
    
    return matchesEnv
  }).map(alert => ({
    type: alert.severity === 'critical' || alert.severity === 'error' ? 'error' : 'warning',
    title: alert.alertname,
    message: alert.summary || alert.description || `Alert on ${alert.server_name || alert.instance} (Env: ${alert.environment})`,
    server: alert.server_name || alert.instance,
    environment: alert.environment,
    severity: alert.severity,
    startsAt: alert.startsAt,
    id: alert.id
  }))

  const filteredAlerts = alertsToDisplay.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
      (alert.server && alert.server.toLowerCase().includes(alertSearchTerm.toLowerCase()))
    const matchesType = alertTypeFilter === "all" || alert.type === alertTypeFilter
    const matchesTime = alertTimeFilter === "all"
    return matchesSearch && matchesType && matchesTime
  })

  const navigationItems = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: TrendingUp,
    },
    { 
      id: "server-metrics", 
      label: "Server Metrics", 
      icon: BarChart3,
    },
    { 
      id: "network-metrics", 
      label: "Network Metrics", 
      icon: Activity,
    },
    { 
      id: "app-logs", 
      label: "App Logs", 
      icon: FileText,
    },
  ]

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      {/* Fixed Header Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 border-b px-6 py-4 flex items-center justify-between z-40 transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          {/* Left side - Logo and selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSelector}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <img src="/logo-landscape.jpg" alt="Infrastructure Monitor" className="h-8 w-auto object-contain" />
              <div>
                <span
                  className={`text-2xl font-bold tracking-tight select-none transition-colors duration-300 text-sky-600 ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  InnoWatch
                </span>
                <div
                  className={`text-sm transition-colors duration-300 cursor-pointer hover:text-blue-600 ${
                    isDarkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-600 hover:text-blue-600"
                  }`}
                  onClick={onOpenSelector}
                >
                  {selectedApp === "All" ? "All Applications" : selectedApp} •{" "}
                  {selectedEnvironment === "All" ? "All Environments" : selectedEnvironment}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Navigation and utility buttons */}
          <div className="flex items-center gap-6">
            {/* Navigation Menu */}
            <nav
              className={`p-2 rounded-2xl backdrop-blur-lg border shadow-lg ${
                isDarkMode 
                  ? "bg-gray-800/80 border-gray-600/40" 
                  : "bg-white/80 border-gray-200/40"
              }`}
            >
              <ul className="flex items-center gap-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  
                  return (
                    <li key={item.id}>
                      <button
                        className={`flex items-center gap-2 px-4 py-2 transition-colors rounded-xl ${
                          isActive
                            ? isDarkMode
                              ? "bg-blue-600/20 text-blue-300"
                              : "bg-blue-100/80 text-blue-700"
                            : isDarkMode
                              ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/50"
                        }`}
                        onClick={() => onPageChange(item.id)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Separator line */}
            <div className={`h-8 w-px transition-colors duration-300 ${
              isDarkMode ? "bg-gray-600" : "bg-gray-300"
            }`} />
            
            {/* Utility buttons */}
            <div
              className={`p-2 rounded-2xl backdrop-blur-lg border shadow-lg ${
                isDarkMode 
                  ? "bg-gray-800/80 border-gray-600/40" 
                  : "bg-white/80 border-gray-200/40"
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Theme Toggle Button */}
                <button
                  className={`p-2 transition-colors rounded-xl ${
                    isDarkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/50"
                  }`}
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Alerts Button */}
                <div className="relative">
                  <button
                    className={`p-2 transition-colors rounded-xl relative ${
                      isDarkMode
                        ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/50"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAlertsPopup(!showAlertsPopup)
                    }}
                    title="View alerts"
                  >
                    <Bell className="w-5 h-5" />
                    {alertsToDisplay.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {alertsToDisplay.length}
                      </span>
                    )}
                  </button>

                  {/* Alerts Popup */}
                  {showAlertsPopup && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowAlertsPopup(false)}
                      />
                      <div
                        className={`absolute top-12 right-0 w-80 rounded-lg shadow-2xl border z-50 backdrop-blur-xl ${
                          isDarkMode ? "bg-gray-800/95 border-gray-600" : "bg-white/95 border-gray-200"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <div className="flex items-center justify-between">
                            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              Alerts ({alertsToDisplay.length})
                            </h3>
                            <button 
                              onClick={() => setShowAlertsPopup(false)}
                              className={`p-1 rounded-lg transition-colors ${
                                isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {isLoading ? (
                            <div className="text-center py-4">
                              <div
                                className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${
                                  isDarkMode ? "border-white" : "border-gray-900"
                                }`}
                              />
                            </div>
                          ) : alertsToDisplay.length > 0 ? (
                            alertsToDisplay.slice(0, 5).map((alert, index) => (
                              <div key={alert.id || index} className="p-4 border-b border-gray-100/10 last:border-b-0">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-2 h-2 rounded-full mt-2 ${
                                      alert.type === "error" ? "bg-red-500" : alert.type === "warning" ? "bg-yellow-500" : "bg-blue-500"
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <h4 className={`font-medium text-sm ${
                                      alert.type === "error" ? "text-red-400" : alert.type === "warning" ? "text-yellow-400" : "text-blue-400"
                                    }`}>
                                      {alert.title}
                                    </h4>
                                    <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                      {alert.message}
                                    </p>
                                    {alert.server && (
                                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        Server: {alert.server}
                                      </p>
                                    )}
                                    {alert.environment && (
                                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        Environment: {alert.environment}
                                      </p>
                                    )}
                                    <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                      {alert.startsAt ? new Date(alert.startsAt).toLocaleString() : "Just now"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <Bell className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>No alerts</p>
                            </div>
                          )}
                        </div>
                        {alertsToDisplay.length > 5 && (
                          <div className={`p-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <button
                              className="w-full text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                              onClick={() => {
                                setShowAlertsPopup(false)
                                setShowFullAlertsModal(true)
                              }}
                            >
                              View All Alerts
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* User Profile Button */}
                <button
                  className={`p-2 transition-colors rounded-xl ${
                    isDarkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/50"
                  }`}
                  title="User profile"
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full Alerts Modal */}
      {showFullAlertsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  All System Alerts
                </h2>
                <button
                  onClick={() => setShowFullAlertsModal(false)}
                  className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? "hover:text-gray-200" : ""}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={alertSearchTerm}
                    onChange={(e) => setAlertSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <select
                  value={alertTypeFilter}
                  onChange={(e) => setAlertTypeFilter(e.target.value)}
                  className={`px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[50vh]">
              <div className="p-4 space-y-2">
                {filteredAlerts.map((alert, index) => (
                  <div
                    key={alert.id || index}
                    className={`p-3 rounded-md border-l-4 ${
                      isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                    } ${
                      alert.type === "error" 
                        ? isDarkMode 
                          ? "border-red-500 bg-red-900/20" 
                          : "border-red-500 bg-red-50"
                        : alert.type === "warning" 
                          ? isDarkMode
                            ? "border-yellow-500 bg-yellow-900/20"
                            : "border-yellow-500 bg-yellow-50"
                          : isDarkMode
                            ? "border-blue-500 bg-blue-900/20"
                            : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          alert.type === "error" 
                            ? isDarkMode
                              ? "bg-red-800 text-red-200"
                              : "bg-red-100 text-red-700"
                            : alert.type === "warning"
                              ? isDarkMode
                                ? "bg-yellow-800 text-yellow-200"
                                : "bg-yellow-100 text-yellow-700"
                              : isDarkMode
                                ? "bg-blue-800 text-blue-200"
                                : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {alert.type.toUpperCase()}
                      </span>
                      <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {alert.startsAt ? new Date(alert.startsAt).toLocaleString() : "Just now"}
                      </span>
                      {alert.environment && (
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                        }`}>
                          {alert.environment}
                        </span>
                      )}
                    </div>
                    <h4 className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {alert.title}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {alert.message}
                    </p>
                    {alert.server && (
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Server: {alert.server}
                      </p>
                    )}
                  </div>
                ))}
                {filteredAlerts.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      No alerts found
                    </h3>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                      No alerts match your search criteria
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`px-8 py-8 pt-24 transition-colors duration-300 ${isDarkMode ? "text-white" : ""}`}>
        {children}
      </main>

      {/* ChatBot Component */}
      <ChatBot 
        selectedEnvironment={selectedEnvironment}
        selectedApp={selectedApp}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}

export default Layout
