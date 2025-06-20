"use client"

import { useState } from "react"
import Layout from "./components/Layout"
import Overview from "./pages/Overview"
import ServerMetrics from "./pages/ServerMetrics"
import NetworkMetrics from "./pages/NetworkMetrics"
import AppLogs from "./pages/AppLogs"
import EnvironmentSelector from "./components/EnvironmentSelector"
import "./App.css"

function App() {
  const [selectedEnvironment, setSelectedEnvironment] = useState("All")
  const [selectedApp, setSelectedApp] = useState("All")
  const [currentPage, setCurrentPage] = useState("overview")
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleEnvironmentAppSelect = (environment, app) => {
    setSelectedEnvironment(environment)
    setSelectedApp(app)
    setIsSelectorOpen(false)
  }

  const renderCurrentPage = () => {
    const pageProps = { selectedEnvironment, selectedApp, isDarkMode }

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
    <div className="min-h-screen bg-gray-100">
      {/* Environment Selector Sidebar */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSelectorOpen(false)} />
          <div className="relative bg-white w-1/3 h-full shadow-xl">
            <div className="p-6 h-full overflow-y-auto">
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <EnvironmentSelector onSelect={handleEnvironmentAppSelect} />
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
