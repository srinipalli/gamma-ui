"use client"

import { useState, useEffect } from "react"
import { Settings, ChevronRight, Server, Globe, Layers } from "lucide-react"
import { api } from "../api/client"

const EnvironmentSelector = ({ onSelect, isDarkMode }) => { // Added isDarkMode prop
  const [environments, setEnvironments] = useState([])
  const [applications, setApplications] = useState({})
  const [selectedEnvironment, setSelectedEnvironment] = useState("")
  const [selectedApp, setSelectedApp] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnvironments()
  }, [])

  const fetchEnvironments = async () => {
    try {
      setLoading(true)
      const envData = await api.getEnvironments()
      setEnvironments(envData.environments || ["Development", "Staging", "QA", "Production"])
      setApplications(
        envData.applications || {
          Development: ["app1", "app2", "app3"],
          Staging: ["app1", "app2", "app3"],
          QA: ["app1", "app2", "app3"],
          Production: ["app1", "app2", "app3"],
        },
      )
    } catch (error) {
      console.error("Failed to fetch environments:", error)
      // Fallback to default data
      setEnvironments(["Development", "Staging", "QA", "Production"])
      setApplications({
        Development: ["app1", "app2", "app3"],
        Staging: ["app1", "app2", "app3"],
        QA: ["app1", "app2", "app3"],
        Production: ["app1", "app2", "app3"],
      })
    } finally {
      setLoading(false)
    }
  }

  const getAvailableApps = () => {
    if (selectedEnvironment === "All") {
      // Return all unique applications from all environments
      const allApps = new Set();
      Object.values(applications).forEach(appArray => {
        appArray.forEach(app => allApps.add(app));
      });
      return Array.from(allApps);
    }
    if (selectedEnvironment && applications[selectedEnvironment]) {
      return applications[selectedEnvironment]
    }
    return []
  }

  const handleProceed = () => {
    if (selectedEnvironment && selectedApp) {
      onSelect(selectedEnvironment, selectedApp)
    }
  }

  if (loading) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-6 rounded-lg ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mt-3">Loading environments...</span>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}>
      <div className="text-center mb-8">
        <div className={`rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center ${isDarkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
          <Settings className="w-8 h-8 text-blue-500" /> {/* Icon color adjusted */}
        </div>
        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-2`}>Environment & Application</h1>
        <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Select your monitoring scope</p>
      </div>

      <div className="space-y-6 flex-1">
        <div>
          <label className={`block text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            <Globe className="inline w-4 h-4 mr-2 text-blue-500" /> {/* Icon color adjusted */}
            Environment
          </label>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSelectedEnvironment("All")
                setSelectedApp("")
              }}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedEnvironment === "All"
                  ? `${isDarkMode ? "border-purple-600 bg-purple-900/30 text-purple-300" : "border-purple-500 bg-purple-50 text-purple-700"}`
                  : `${isDarkMode ? "border-gray-700 hover:border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-200 hover:border-gray-300 text-gray-700"}`
              }`}
            >
              <div className="flex items-center justify-center">
                <Layers className="w-4 h-4 mr-1" />
                <span className="font-medium">All Environments</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              {environments.map((env) => (
                <button
                  key={env}
                  onClick={() => {
                    setSelectedEnvironment(env)
                    setSelectedApp("")
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedEnvironment === env
                      ? `${isDarkMode ? "border-blue-600 bg-blue-900/30 text-blue-300" : "border-blue-500 bg-blue-50 text-blue-700"}`
                      : `${isDarkMode ? "border-gray-700 hover:border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-200 hover:border-gray-300 text-gray-700"}`
                  }`}
                >
                  <div className="font-medium">{env}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedEnvironment && (
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              <Server className="inline w-4 h-4 mr-2 text-blue-500" /> {/* Icon color adjusted */}
              Application
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedApp("All")}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedApp === "All"
                    ? `${isDarkMode ? "border-purple-600 bg-purple-900/30 text-purple-300" : "border-purple-500 bg-purple-50 text-purple-700"}`
                    : `${isDarkMode ? "border-gray-700 hover:border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-200 hover:border-gray-300 text-gray-700"}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    <span className="font-medium">All Applications</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {getAvailableApps().map((app) => (
                <button
                  key={app}
                  onClick={() => setSelectedApp(app)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedApp === app
                      ? `${isDarkMode ? "border-blue-600 bg-blue-900/30 text-blue-300" : "border-blue-500 bg-blue-50 text-blue-700"}`
                      : `${isDarkMode ? "border-gray-700 hover:border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-200 hover:border-gray-300 text-gray-700"}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{app}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleProceed}
          disabled={!selectedEnvironment || !selectedApp}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            selectedEnvironment && selectedApp
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : `${isDarkMode ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`
          }`}
        >
          {selectedEnvironment && selectedApp ? `Apply Selection` : "Select Environment & Application"}
        </button>
      </div>
    </div>
  )
}

export default EnvironmentSelector