"use client"

import { useState } from "react"
import Layout from "./components/Layout"
import Overview from "./pages/Overview"
import ServerMetrics from "./pages/ServerMetrics"
import NetworkMetrics from "./pages/NetworkMetrics"
import AppLogs from "./pages/AppLogs"
import EnvironmentSelector from "./components/EnvironmentSelector"
import "./App.css" // Make sure your CSS file is correctly imported for styling

function App() {
  const [selectedEnvironment, setSelectedEnvironment] = useState("All")
  const [selectedApp, setSelectedApp] = useState("All")
  const [currentPage, setCurrentPage] = useState("overview")
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false) // This state controls dark mode

  const handleEnvironmentAppSelect = (environment, app) => {
    setSelectedEnvironment(environment)
    setSelectedApp(app)
    setIsSelectorOpen(false)
  }

  const renderCurrentPage = () => {
    const pageProps = { selectedEnvironment, selectedApp, isDarkMode } // Pass isDarkMode to content pages too

    switch (currentPage) {
      case "overview":
        return <Overview {...pageProps} onPageChange={setCurrentPage} />
      case "server-metrics":
        return <ServerMetrics {...pageProps} />
      case "network-metrics":
        return <NetworkMetrics {...pageProps} />
      case "app-logs":
        return <AppLogs {...pageProps} />
      default:
        return <Overview {...pageProps} onPageChange={setCurrentPage} />
    }
  }

  return (
    // Apply dark mode class to the root div to enable Tailwind's dark variants globally
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Environment Selector Sidebar */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay background */}
          <div
            className="fixed inset-0 bg-black"
            style={{ opacity: isDarkMode ? 0.7 : 0.5 }} // This line was fine
            onClick={() => setIsSelectorOpen(false)}
          />
          {/* Selector panel */}
          <div className={`relative w-1/3 h-full shadow-xl transition-colors duration-300
            ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
          > {/* Removed the extra '>' that was on a new line here */}
            <div className="p-6 h-full overflow-y-auto">
              <button
                onClick={() => setIsSelectorOpen(false)}
                className={`absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors
                  ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}
              >
                ✕
              </button>
              <EnvironmentSelector
                onSelect={handleEnvironmentAppSelect}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      )}

      <Layout
        selectedEnvironment={selectedEnvironment}
        selectedApp={selectedApp}
        onOpenSelector={() => setIsSelectorOpen(true)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      >
        {renderCurrentPage()}
      </Layout>
    </div>
  )
}

export default App