"use client"

import { useState, useEffect } from "react"
import { Settings, ChevronRight, Server, Globe, Layers } from "lucide-react"
import { api } from "../api/client"

const EnvironmentSelector = ({ onSelect }) => {
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
      return ["app1", "app2", "app3"]
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
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading environments...</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-8">
        <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Settings className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Environment & Application</h1>
        <p className="text-gray-600">Select your monitoring scope</p>
      </div>

      <div className="space-y-6 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Globe className="inline w-4 h-4 mr-2" />
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
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
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
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Server className="inline w-4 h-4 mr-2" />
              Application
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedApp("All")}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedApp === "All"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
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
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
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
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {selectedEnvironment && selectedApp ? `Apply Selection` : "Select Environment & Application"}
        </button>
      </div>
    </div>
  )
}

export default EnvironmentSelector
