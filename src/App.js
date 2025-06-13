import React, { useState, useEffect } from 'react';
import { logAPI } from './api/client';
import './App.css';
import ApplicationDashboard from './components/ApplicationDashboard';
import EnvironmentSelector from './components/EnvironmentSelector';
import SlidingPanel from 'react-sliding-side-panel';
import 'react-sliding-side-panel/lib/index.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState('All');
  const [selectedApp, setSelectedApp] = useState('All');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  const handleEnvironmentAppSelect = (environment, app) => {
    setSelectedEnvironment(environment);
    setSelectedApp(app);
    setIsSelectorOpen(false);
  };

  const openSelector = () => {
    setIsSelectorOpen(true);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="App-header">
          <p>Connecting to backend...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="App">
        <div className="App-header">
          <p>Backend connection failed. Please check if the FastAPI server is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Sliding Panel for Environment/App Selector */}
      <SlidingPanel type="left" isOpen={isSelectorOpen} size={30}>
        <div className="p-4 h-full bg-white flex flex-col">
          <button
            onClick={() => setIsSelectorOpen(false)}
            className="self-end mb-4 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
          <EnvironmentSelector onSelect={handleEnvironmentAppSelect} />
        </div>
      </SlidingPanel>

      {/* Main Dashboard */}
      <ApplicationDashboard 
        selectedEnvironment={selectedEnvironment}
        selectedApp={selectedApp}
        onOpenSelector={openSelector}
      />
    </div>
  );
}

export default App;
