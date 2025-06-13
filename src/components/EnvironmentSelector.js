import React, { useState, useEffect } from 'react';
import { logAPI } from '../api/client';
import { Settings, ChevronRight, Server, Globe, Layers } from 'lucide-react';

const EnvironmentSelector = ({ onSelect }) => {
  const [environments, setEnvironments] = useState([]);
  const [applications, setApplications] = useState({});
  const [allApplications, setAllApplications] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [selectedApp, setSelectedApp] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const envData = await logAPI.getEnvironments();
        const envList = envData.environments || [];
        setEnvironments(envList);
        
        // Fetch applications for all environments
        const appPromises = envList.map(async (env) => {
          const appData = await logAPI.getApplications(env);
          return { env, apps: appData.applications || [] };
        });
        
        const appResults = await Promise.all(appPromises);
        const appMap = {};
        const allAppsSet = new Set();
        
        appResults.forEach(({ env, apps }) => {
          appMap[env] = apps;
          apps.forEach(app => allAppsSet.add(app));
        });
        
        setApplications(appMap);
        setAllApplications(Array.from(allAppsSet));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getAvailableApps = () => {
    if (selectedEnvironment === 'All') {
      return allApplications;
    }
    if (selectedEnvironment && applications[selectedEnvironment]) {
      return applications[selectedEnvironment];
    }
    return [];
  };

  const handleProceed = () => {
    if (selectedEnvironment && selectedApp) {
      onSelect(selectedEnvironment, selectedApp);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading environments...</p>
        </div>
      </div>
    );
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
        {/* Environment Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Globe className="inline w-4 h-4 mr-2" />
            Environment
          </label>
          <div className="grid grid-cols-1 gap-3">
            {/* All Environments Option */}
            <button
              onClick={() => {
                setSelectedEnvironment('All');
                setSelectedApp(''); // Reset app selection when env changes
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedEnvironment === 'All'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center">
                <Layers className="w-4 h-4 mr-1" />
                <span className="font-medium">All Environments</span>
              </div>
            </button>
            
            {environments.map((env) => (
              <button
                key={env}
                onClick={() => {
                  setSelectedEnvironment(env);
                  setSelectedApp(''); // Reset app selection when env changes
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedEnvironment === env
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium">{env}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Application Selection */}
        {selectedEnvironment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Server className="inline w-4 h-4 mr-2" />
              Application
            </label>
            <div className="space-y-2">
              {/* All Applications Option */}
              <button
                onClick={() => setSelectedApp('All')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedApp === 'All'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
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
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
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

        {/* Proceed Button */}
        <button
          onClick={handleProceed}
          disabled={!selectedEnvironment || !selectedApp}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            selectedEnvironment && selectedApp
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedEnvironment && selectedApp 
            ? `Apply Selection`
            : 'Select Environment & Application'
          }
        </button>
      </div>
    </div>
  );
};

export default EnvironmentSelector;
