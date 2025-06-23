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
  MessageCircle,
  Maximize2,
  Minimize2,
  Send,
} from "lucide-react"
import { api } from "../api/client"

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
  const [showChatBot, setShowChatBot] = useState(false)
  const [isChatMaximized, setIsChatMaximized] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: "bot", message: "Hello! I'm your infrastructure monitoring assistant. How can I help you today?" },
  ])
  const [chatInput, setChatInput] = useState("")
  const [showContextModal, setShowContextModal] = useState(false)
  const [selectedContext, setSelectedContext] = useState(null)
  const [chatHistory, setChatHistory] = useState([])

  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    const fetchActiveAlerts = async () => {
      try {
        const alertsData = await api.getActiveAlerts() // Real API call
        setActiveAlerts(alertsData)
        console.log("Fetched active alerts:", alertsData)
      } catch (error) {
        console.error("Failed to fetch active alerts:", error)
        setActiveAlerts([]) // Clear alerts on error
      }
    }

    fetchActiveAlerts() // Fetch immediately on mount
    const interval = setInterval(fetchActiveAlerts, 10000) // Poll every 10 seconds
    return () => clearInterval(interval) // Cleanup on unmount
  }, []) // Empty dependency array means this runs once on mount and cleanup on unmount

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await api.getChatHistory()
        setChatMessages(history)
        setChatHistory(history)
      } catch (error) {
        console.error("Failed to load chat history:", error)
      }
    }
    
    loadChatHistory()
  }, [])

  const fetchAlerts = async () => {
    try {
      console.log("Fetching alerts for environment:", selectedEnvironment)
      
      // Fetch active alerts from your working endpoint
      const alertsData = await api.getActiveAlerts(selectedEnvironment !== "All" ? selectedEnvironment : null)
      console.log("Raw alerts data received:", alertsData)
      console.log("Type of alertsData:", typeof alertsData)
      console.log("Is alertsData an array?", Array.isArray(alertsData))
      
      // Ensure alertsData is an array before mapping
      if (!Array.isArray(alertsData)) {
        console.error("alertsData is not an array:", alertsData)
        throw new Error("Invalid data format received")
      }
      
      // Transform the alerts from your backend format to UI format
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
      
      // Fallback alerts (only used if API fails)
      setAlerts([
        { type: "error", title: "High CPU Usage", message: "Server 1 CPU usage is above 90%" },
        { type: "warning", title: "Memory Warning", message: "Server 3 memory usage is above 80%" },
      ])
    }
  }

const alertsToDisplay = activeAlerts.filter(alert => {
    // Environment mapping for filtering
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
    const matchesTime = alertTimeFilter === "all" // Implement time filtering as needed
    return matchesSearch && matchesType && matchesTime
  })

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleSendMessage = async () => {
    if (chatInput.trim()) {
      const newMessage = { 
        id: Date.now(), 
        type: "user", 
        content: chatInput,
        timestamp: new Date().toISOString()
      }
      
      setChatMessages((prev) => [...prev, newMessage])
      const currentInput = chatInput
      setChatInput("")

      try {
        const response = await api.sendChatMessage(currentInput, {
          environment: selectedEnvironment,
          application: selectedApp,
          timestamp: new Date().toISOString()
        })

        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          content: response.response,
          context: response.context,
          timestamp: response.timestamp,
          has_context: response.context && Object.keys(response.context).length > 0
        }
        
        setChatMessages((prev) => [...prev, botResponse])
        
        // Refresh chat history
        const updatedHistory = await api.getChatHistory()
        setChatHistory(updatedHistory)
        
      } catch (error) {
        console.error("Chat API error:", error)
        const errorResponse = {
          id: Date.now() + 1,
          type: "bot",
          content: "I'm having trouble connecting to the server. Please try again in a moment.",
          timestamp: new Date().toISOString()
        }
        setChatMessages((prev) => [...prev, errorResponse])
      }
    }
  }

  const handleViewContext = async (messageId) => {
    try {
      const contextData = await api.getChatContext(messageId)
      setSelectedContext(contextData)
      setShowContextModal(true)
    } catch (error) {
      console.error("Failed to load context:", error)
    }
  }


  const navigationItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "server-metrics", label: "Server Metrics", icon: BarChart3 },
    { id: "network-metrics", label: "Network Metrics", icon: Activity },
    { id: "app-logs", label: "App Logs", icon: FileText },
  ]

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      {/* Fixed Header Navbar */}
      <div onClick={() => setShowAlertsPopup(false)}>
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

  {/* Right side - Navigation */}
  <nav className="flex-1 flex justify-end">
    <ul className="flex space-x-2">
      {navigationItems.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.id}>
            <button
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-300 ${
                currentPage === item.id
                  ? isDarkMode
                    ? "bg-blue-600 text-blue-100"
                    : "bg-blue-100 text-blue-700"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => onPageChange(item.id)}
            >
              <Icon className="inline w-5 h-5 mr-1 -mt-1" /> {item.label}
            </button>
          </li>
        )
      })}
    </ul>
  </nav>
</div>


          <div className="flex items-center gap-4">
            <button
              className={`relative p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                toggleTheme()
              }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <div className="transition-transform duration-500 ease-in-out">
                {isDarkMode ? <Sun className="w-5 h-5 rotate-180" /> : <Moon className="w-5 h-5 rotate-0" />}
              </div>
            </button>

            <div className="relative">
              <button
                className={`relative p-2 rounded-full transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAlertsPopup(!showAlertsPopup)
                }}
              >
                <Bell className="w-5 h-5" />
                {alertsToDisplay.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {showAlertsPopup && (
                <div
                  className={`absolute top-12 right-0 w-80 rounded-lg shadow-lg border z-50 transition-colors duration-300 ${
                    isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Alerts</h3>
                      <button onClick={() => setShowAlertsPopup(false)} className="text-gray-400 hover:text-gray-600">
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {alertsToDisplay.length > 0 ? (
                      alertsToDisplay.map((alert, index) => (
                        <div key={alert.id || index} className="p-4 border-b border-gray-100 last:border-b-0">
                          <div
                            className={`flex items-start gap-3 ${
                              alert.type === "error" ? "text-red-700" : alert.type === "warning" ? "text-yellow-700" : "text-blue-700"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                alert.type === "error" ? "bg-red-500" : alert.type === "warning" ? "bg-yellow-500" : "bg-blue-500"
                              }`}
                            ></div>
                            <div className="flex-1">
                              <h4 className="font-medium">{alert.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                              {alert.server && (
                                <p className="text-xs text-gray-500 mt-1">Server: {alert.server}</p>
                              )}
                              {alert.environment && (
                                <p className="text-xs text-gray-500">Environment: {alert.environment}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {alert.startsAt ? new Date(alert.startsAt).toLocaleString() : "Just now"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No alerts</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <button
                      className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => {
                        setShowAlertsPopup(false)
                        setShowFullAlertsModal(true)
                      }}
                    >
                      View All Alerts
                    </button>
                  </div>
                </div>
              )}

              

              {showFullAlertsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div
                    className={`rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    }`}
                  >
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          All System Alerts
                        </h2>
                        <button
                          onClick={() => setShowFullAlertsModal(false)}
                          className="text-gray-400 hover:text-gray-600 text-xl"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Search alerts..."
                            value={alertSearchTerm}
                            onChange={(e) => setAlertSearchTerm(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                : "border-gray-300"
                            }`}
                          />
                        </div>
                        <select
                          value={alertTypeFilter}
                          onChange={(e) => setAlertTypeFilter(e.target.value)}
                          className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"
                          }`}
                        >
                          <option value="all">All Types</option>
                          <option value="error">Errors</option>
                          <option value="warning">Warnings</option>
                          <option value="info">Info</option>
                        </select>
                        <select
                          value={alertTimeFilter}
                          onChange={(e) => setAlertTimeFilter(e.target.value)}
                          className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"
                          }`}
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-y-auto max-h-[50vh]">
                      <div className="p-4 space-y-2">
                        {filteredAlerts.map((alert, index) => (
                          <div
                            key={alert.id || index}
                            className={`p-3 rounded-md border-l-4 hover:bg-gray-50 ${
                              alert.type === "error" 
                                ? "border-red-500 bg-red-50" 
                                : alert.type === "warning" 
                                  ? "border-yellow-500 bg-yellow-50"
                                  : "border-blue-500 bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  alert.type === "error" 
                                    ? "bg-red-100 text-red-700" 
                                    : alert.type === "warning"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {alert.type.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {alert.startsAt ? new Date(alert.startsAt).toLocaleString() : "Just now"}
                              </span>
                              {alert.environment && (
                                <span className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                                  {alert.environment}
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                            {alert.server && (
                              <p className="text-xs text-gray-500 mt-1">Server: {alert.server}</p>
                            )}
                          </div>
                        ))}
                        {filteredAlerts.length === 0 && (
                          <div className="text-center py-12">
                            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
                            <p className="text-gray-600">No alerts match your search criteria</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              className={`p-2 rounded-full transition-colors ${
                isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>
      </div>


      {/* Floating Chat Bot */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showChatBot && (
          <button
            onClick={() => setShowChatBot(true)}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-110"
          >
            <MessageCircle className="w-6 h-6 mx-auto" />
          </button>
        )}

        {showChatBot && (
          <div
            className={`transition-all duration-300 shadow-2xl rounded-lg overflow-hidden ${
              isChatMaximized ? "fixed inset-4 w-auto h-auto" : "w-80 h-96"
            } ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isDarkMode ? "bg-gray-700 border-gray-600" : "bg-blue-600 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">Infrastructure Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChatMaximized(!isChatMaximized)}
                  className="p-1 rounded hover:bg-blue-700 transition-colors"
                >
                  {isChatMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setShowChatBot(false)
                    setIsChatMaximized(false)
                  }}
                  className="p-1 rounded hover:bg-blue-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isChatMaximized ? "h-[calc(100vh-200px)]" : "h-64"}`}>
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-xs">
                    <div
                      className={`px-3 py-2 rounded-lg text-sm ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-200"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.content}
                    </div>
                    
                    {/* Context button for bot messages */}
                    {msg.type === "bot" && msg.has_context && (
                      <button
                        onClick={() => handleViewContext(msg.id)}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>📊</span> View Context
                      </button>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-4 border-t ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask about your infrastructure..."
                  className={`flex-1 px-3 py-2 rounded-md border text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-300"
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Enhanced Context Modal */}
      {showContextModal && selectedContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`rounded-lg shadow-lg p-6 w-full max-w-5xl max-h-[80vh] overflow-y-auto ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Chat Context Data</h3>
              <button 
                onClick={() => setShowContextModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">User Message:</h4>
                <div className="bg-blue-50 p-3 rounded border">
                  {selectedContext.user_message}
                </div>
              </div>
              
              {selectedContext.context && selectedContext.context.sql_queries && (
                <div>
                  <h4 className="font-semibold mb-2">Generated SQL Queries:</h4>
                  <div className="bg-purple-50 p-3 rounded border">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedContext.context.sql_queries, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">Bot Response:</h4>
                <div className="bg-gray-50 p-3 rounded border">
                  {selectedContext.bot_response}
                </div>
              </div>
              
              {selectedContext.context && selectedContext.context.infrastructure_data && (
                <div>
                  <h4 className="font-semibold mb-2">Retrieved Data:</h4>
                  <div className="bg-green-50 p-3 rounded border">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedContext.context.infrastructure_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      <main className={`px-8 py-8 pt-24 transition-colors duration-300 ${isDarkMode ? "text-white" : ""}`}>
        {children}
      </main>
    </div>
  )
}

export default Layout