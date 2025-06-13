import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logAPI } from '../api/client';
import FloatingChatbot from './FloatingChatbot';
import GrafanaChart from './GrafanaChart';
import logoLandscape from '../logo-landscape.jpg';
import {
  Cpu, HardDrive, Server, Thermometer, Activity, FileText, Bell, User, 
  CheckCircle, AlertTriangle, X, Menu, BarChart3, TrendingUp, RefreshCw,
  AlertCircle, Shield, Zap, Info
} from "lucide-react";
import { getGlobalServerName } from '../utils/serverNameMapping';

export default function ApplicationDashboard({ selectedEnvironment, selectedApp, onOpenSelector }) {
  const [logs, setLogs] = useState([]);
  const [serverMetrics, setServerMetrics] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [performanceSummary, setPerformanceSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAlertPopupOpen, setIsAlertPopupOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastSummaryFetch, setLastSummaryFetch] = useState(null);
  const [parsedSummary, setParsedSummary] = useState(null);
  const [criticalServers, setCriticalServers] = useState([]);
  const [showRiskInfo, setShowRiskInfo] = useState(false);

  // Log analysis popup state
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [logAnalysis, setLogAnalysis] = useState(null);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const currentSelection = useMemo(() => 
    `${selectedEnvironment}-${selectedApp}`, 
    [selectedEnvironment, selectedApp]
  );

  // Markdown parsing for summary sections
  const parseMarkdownText = (text) => {
    if (!text) return text;
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/#{2,}\s*(.*?)$/gm, '<h3 class="font-semibold text-lg mb-2">$1</h3>')
      .replace(/\n/g, '<br/>');
  };

  // Parse performance summary and use global server names
  const parsePerformanceSummary = useCallback((summaryText) => {
    if (!summaryText) return null;
    const sections = {
      overview: '',
      criticalIssues: [],
      serverHealth: [],
      recommendations: [],
      failurePredictions: [],
      environment: selectedEnvironment,
      application: selectedApp
    };
    const cleanText = summaryText.replace(/#+\s*/g, '').trim();
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim());
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (!trimmed) return;
      const serverMatches = trimmed.match(/server\d+/gi);
      const isCritical = /critical|100%|fluctuating|slow|impacting|high cpu|high memory|performance issues|spikes to 100%|resource exhaustion|failure|risk/i.test(trimmed);
      const isRecommendation = /recommend|investigate|implement|expand|address|next steps|consider|restart|analyze|pinpoint/i.test(trimmed);

      if (isCritical && serverMatches) {
        const existingServers = sections.failurePredictions.map(p => p.server);
        serverMatches.forEach(server => {
          const globalServerName = getGlobalServerName(server, selectedEnvironment);
          if (!existingServers.includes(globalServerName)) {
            sections.failurePredictions.push({
              server: globalServerName,
              issue: parseMarkdownText(trimmed),
              severity: /critical|100%/i.test(trimmed) ? 'critical' : 'high',
              environment: selectedEnvironment
            });
          }
        });
      } else if (isCritical && !serverMatches) {
        sections.criticalIssues.push(parseMarkdownText(trimmed));
      } else if (isRecommendation) {
        sections.recommendations.push(parseMarkdownText(trimmed));
      } else if (serverMatches && !isRecommendation) {
        const existingHealthServers = sections.serverHealth.map(h => h.server);
        serverMatches.forEach(server => {
          const globalServerName = getGlobalServerName(server, selectedEnvironment);
          if (!existingHealthServers.includes(globalServerName)) {
            sections.serverHealth.push({
              server: globalServerName,
              status: parseMarkdownText(trimmed),
              environment: selectedEnvironment
            });
          }
        });
      } else if (!serverMatches && !isRecommendation) {
        sections.overview += parseMarkdownText(trimmed) + '. ';
      }
    });
    return sections;
  }, [selectedEnvironment, selectedApp]);

  useEffect(() => {
    if (performanceSummary) {
      const parsed = parsePerformanceSummary(performanceSummary);
      setParsedSummary(parsed);
      const critical = parsed?.failurePredictions || [];
      setCriticalServers(critical.map(item => item.server));
    }
  }, [performanceSummary, parsePerformanceSummary]);

  // Risk assessment logic
  const assessServerRisk = (metric) => {
    const riskFactors = [];
    if (metric.cpu_usage > 90) riskFactors.push('Critical CPU usage');
    else if (metric.cpu_usage > 80) riskFactors.push('High CPU usage');
    if (metric.memory_usage > 90) riskFactors.push('Critical memory usage');
    else if (metric.memory_usage > 80) riskFactors.push('High memory usage');
    if (metric.disk_utilization > 90) riskFactors.push('Critical disk usage');
    else if (metric.disk_utilization > 85) riskFactors.push('High disk usage');
    if (metric.cpu_temp > 80) riskFactors.push('Critical CPU temperature');
    else if (metric.cpu_temp > 75) riskFactors.push('High CPU temperature');
    if (metric.server_health === 'Critical') riskFactors.push('Critical health status');
    else if (metric.server_health === 'Bad' || metric.server_health === 'Warning') riskFactors.push('Poor health status');
    return {
      isAtRisk: riskFactors.length > 0,
      riskLevel: riskFactors.length >= 3 ? 'critical' : riskFactors.length >= 2 ? 'high' : 'medium',
      factors: riskFactors
    };
  };

  // Fetch performance summary from LLM with caching
  const fetchPerformanceSummary = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = `summary-${currentSelection}`;
    if (!forceRefresh && lastSummaryFetch && (now - lastSummaryFetch < 300000)) return;
    setSummaryLoading(true);
    try {
      const context = {
        environment: selectedEnvironment,
        application: selectedApp,
        serverMetrics: serverMetrics.slice(0, 10),
        errorCount: dashboardStats.error_stats?.reduce((sum, stat) => sum + stat.count, 0) || 0,
        timestamp: new Date().toISOString(),
        serverCount: serverMetrics.length
      };
      let prompt = '';
      if (selectedEnvironment === 'All' && selectedApp === 'All') {
        prompt = 'Provide a comprehensive performance summary for all applications across all environments for the past day. Include overall system health, critical issues, server failure predictions with specific server names and environments, and recommendations. Use proper markdown formatting with **bold** for important terms.';
      } else if (selectedEnvironment === 'All') {
        prompt = `Provide a performance summary for ${selectedApp} application across all environments for the past day. Compare performance between environments, identify servers at risk of failure with their environment details, and highlight any concerns. Use proper markdown formatting with **bold** for important terms.`;
      } else if (selectedApp === 'All') {
        prompt = `Provide a performance summary for all applications in ${selectedEnvironment} environment for the past day. Include key metrics, health status, server failure predictions with specific server names, and any concerns. Use proper markdown formatting with **bold** for important terms.`;
      } else {
        prompt = `Provide a performance summary for ${selectedApp} in ${selectedEnvironment} environment for the past day. Include key metrics, health status of specific servers, server failure predictions, and any concerns. Always mention server names with their environment context. Use proper markdown formatting with **bold** for important terms.`;
      }
      const response = await logAPI.sendChatMessage(prompt, context);
      setPerformanceSummary(response.response);
      setLastSummaryFetch(now);
      localStorage.setItem(cacheKey, JSON.stringify({
        summary: response.response,
        timestamp: now
      }));
    } catch (error) {
      setPerformanceSummary('Unable to generate performance summary at this time. Please check your connection and try again.');
    } finally {
      setSummaryLoading(false);
    }
  }, [currentSelection, serverMetrics, dashboardStats, lastSummaryFetch, selectedEnvironment, selectedApp]);

  useEffect(() => {
    const cacheKey = `summary-${currentSelection}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { summary, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < 300000) {
          setPerformanceSummary(summary);
          setLastSummaryFetch(timestamp);
          return;
        }
      } catch (e) {}
    }
    setPerformanceSummary('');
    setLastSummaryFetch(null);
  }, [currentSelection]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedEnvironment !== 'All') params.environment = selectedEnvironment;
        if (selectedApp !== 'All') params.app_name = selectedApp;
        const logsData = await logAPI.getCombinedLogs(params);
        setLogs(
          logsData.map(item => ({
            id: (item.log._id || item.log.id)?.toString(),
            timestamp: item.log.timestamp,
            level: item.log.level,
            message: item.log.message,
            source: item.log.source,
            environment: item.log.environment,
            server: item.log.server,
            app_name: item.log.app_name,
            exception_type: item.log.exception_type,
            exception_message: item.log.exception_message,
            stacktrace: item.log.stacktrace
          }))
        );
      } catch (error) {
        setError("Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [selectedEnvironment, selectedApp]);

  useEffect(() => {
    const fetchServerMetrics = async () => {
      try {
        const envParam = selectedEnvironment === 'All' ? null : selectedEnvironment;
        const appParam = selectedApp === 'All' ? null : selectedApp;
        const data = await logAPI.getServerMetrics(envParam, appParam);
        // Deduplicate servers based on server name and environment
        const uniqueServers = data.reduce((acc, metric) => {
          const key = `${metric.server}-${metric.environment}`;
          if (!acc.has(key)) acc.set(key, metric);
          return acc;
        }, new Map());
        setServerMetrics(Array.from(uniqueServers.values()));
      } catch (error) {}
    };
    fetchServerMetrics();
    const interval = setInterval(fetchServerMetrics, 30000);
    return () => clearInterval(interval);
  }, [selectedEnvironment, selectedApp]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const stats = await logAPI.getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {}
    };
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (serverMetrics.length > 0 && Object.keys(dashboardStats).length > 0) {
      fetchPerformanceSummary();
    }
  }, [serverMetrics, dashboardStats, fetchPerformanceSummary]);

  const handleRefreshSummary = () => fetchPerformanceSummary(true);

  const alerts = [
    ...(dashboardStats.error_stats || []).filter((stat) => stat.count > 0).map((stat) => ({
      type: stat._id === "Critical" ? "error" : "warning",
      title: stat._id,
      message: `There are ${stat.count} ${stat._id} level errors.`,
    })),
  ];

  const fetchLogAnalysis = async (logId) => {
    if (!logId || logId === 'undefined' || logId === undefined) {
      setLogAnalysis({ error: "Invalid log ID provided" });
      return;
    }
    setAnalysisLoading(true);
    setShowAnalysisPopup(true);
    setLogAnalysis(null);
    try {
      const data = await logAPI.getLogAnalysis(logId);
      setLogAnalysis(data);
    } catch (err) {
      setLogAnalysis({ error: err.message || "No analysis found for this log." });
    }
    setAnalysisLoading(false);
  };

  const getPerformanceSummaryTitle = () => {
    if (selectedEnvironment === 'All' && selectedApp === 'All') {
      return 'Performance Summary - All Servers';
    } else if (selectedEnvironment === 'All') {
      return `Performance Summary - All Servers Running ${selectedApp}`;
    } else if (selectedApp === 'All') {
      return `Performance Summary - All Servers in ${selectedEnvironment}`;
    } else {
      return `Performance Summary - ${selectedApp} Servers in ${selectedEnvironment}`;
    }
  };

  const getAffectedServers = () => {
    const servers = new Set();
    serverMetrics.forEach(metric => {
      if (selectedEnvironment === 'All' || metric.environment === selectedEnvironment) {
        if (selectedApp === 'All' || metric.app_name === selectedApp) {
          servers.add(getGlobalServerName(metric.server, metric.environment));
        }
      }
    });
    return Array.from(servers);
  };

  const HTMLContent = ({ content }) => (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  );

  const PerformanceSummaryCard = () => {
    const affectedServers = getAffectedServers();
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-600" />
              {getPerformanceSummaryTitle()}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Past 24 Hours • Monitoring {affectedServers.length} server{affectedServers.length !== 1 ? 's' : ''}: {affectedServers.slice(0, 3).join(', ')}
              {affectedServers.length > 3 && ` and ${affectedServers.length - 3} more`}
            </p>
          </div>
          <button
            onClick={handleRefreshSummary}
            disabled={summaryLoading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {summaryLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Analyzing performance data...</span>
          </div>
        ) : parsedSummary ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Overview */}
            {parsedSummary.overview && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Shield className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-800">System Overview</h3>
                </div>
                <div className="text-gray-700 leading-relaxed">
                  <HTMLContent content={parsedSummary.overview.trim()} />
                </div>
              </div>
            )}
            {/* Servers at Risk */}
            {parsedSummary.failurePredictions.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className="font-semibold text-red-800">Critical Servers - Failure Risk Detected</h3>
                </div>
                <div className="space-y-3">
                  {parsedSummary.failurePredictions.map((prediction, index) => (
                    <div key={index} className="bg-white border border-red-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-red-700">{prediction.server}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          prediction.severity === 'critical' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>{prediction.severity === 'critical' ? 'Critical Risk' : 'High Risk'}</span>
                      </div>
                      <div className="text-sm text-red-600">
                        <HTMLContent content={prediction.issue} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">Click refresh to generate performance summary</p>
        )}
      </div>
    );
  };
  const ServerMetricsCard = ({ metric, index }) => {
    const globalServerName = getGlobalServerName(metric.server, metric.environment);
    return (
      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-md font-bold">
            {globalServerName}
            <span className="text-xs text-gray-500 ml-2">
              ({metric.environment})
            </span>
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          <span>CPU:</span>
          <span className={`ml-auto font-mono ${
            metric.cpu_usage > 90 ? 'text-red-600 font-bold' : 
            metric.cpu_usage > 80 ? 'text-yellow-600' : 'text-gray-700'
          }`}>{metric.cpu_usage}%</span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-green-500" />
          <span>Memory:</span>
          <span className={`ml-auto font-mono ${
            metric.memory_usage > 90 ? 'text-red-600 font-bold' : 
            metric.memory_usage > 80 ? 'text-yellow-600' : 'text-gray-700'
          }`}>{metric.memory_usage}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-yellow-500" />
          <span>Disk:</span>
          <span className={`ml-auto font-mono ${
            metric.disk_utilization > 90 ? 'text-red-600 font-bold' : 
            metric.disk_utilization > 80 ? 'text-yellow-600' : 'text-gray-700'
          }`}>{metric.disk_utilization}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-red-500" />
          <span>CPU Temp:</span>
          <span className={`ml-auto font-mono ${
            metric.cpu_temp > 80 ? 'text-red-600 font-bold' : 
            metric.cpu_temp > 70 ? 'text-yellow-600' : 'text-gray-700'
          }`}>{metric.cpu_temp}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <span>Health:</span>
          <span className={`ml-auto font-mono ${
            metric.server_health === 'Critical' ? 'text-red-600 font-bold' : 
            metric.server_health === 'Warning' || metric.server_health === 'Bad' ? 'text-yellow-600' : 'text-green-600'
          }`}>{metric.server_health}</span>
        </div>
      </div>
    );
  };

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">
      {/* Fixed Header Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSelector}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img 
                src={logoLandscape} 
                alt="Innova Solutions" 
                className="h-8 w-auto object-contain"
              />
              <div>
                <span className="text-2xl font-bold text-gray-800 tracking-tight select-none">
                  Infrastructure Monitor
                </span>
                <div className="text-sm text-gray-600">
                  {selectedApp === 'All' ? 'All Applications' : selectedApp} • {selectedEnvironment === 'All' ? 'All Environments' : selectedEnvironment}
                </div>
              </div>
            </div>
          </div>
          <nav>
            <ul className="flex space-x-2">
              <li>
                <button
                  className={`px-4 py-2 rounded-md font-medium transition ${
                    activeTab === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  <TrendingUp className="inline w-5 h-5 mr-1 -mt-1" /> Overview
                </button>
              </li>
              <li>
                <button
                  className={`px-4 py-2 rounded-md font-medium transition ${
                    activeTab === 'metrics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('metrics')}
                >
                  <BarChart3 className="inline w-5 h-5 mr-1 -mt-1" /> Server Metrics
                </button>
              </li>
              <li>
                <button
                  className={`px-4 py-2 rounded-md font-medium transition ${
                    activeTab === 'logs'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('logs')}
                >
                  <FileText className="inline w-5 h-5 mr-1 -mt-1" /> App Logs
                </button>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAlertPopupOpen(true)}
            className="relative p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>
          <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content with top padding to account for fixed header */}
      <main className="px-8 py-8 pt-24">
        {activeTab === "overview" && (
          <>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                <h3 className="text-lg font-semibold">Total Errors</h3>
                <p className="text-2xl font-bold">
                  {dashboardStats.error_stats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <h3 className="text-lg font-semibold">Healthy Servers</h3>
                <p className="text-2xl font-bold">
                  {dashboardStats.health_stats?.find((stat) => stat._id === "Good")?.count || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <Server className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="text-lg font-semibold">Active Servers</h3>
                <p className="text-2xl font-bold">{serverMetrics.length}</p>
              </div>
            </div>
            {/* Performance Summary */}
            <PerformanceSummaryCard />
            {/* Grafana Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GrafanaChart
                title="CPU Usage Trends"
                panelId={1}
                variables={{ environment: selectedEnvironment !== 'All' ? selectedEnvironment : '', application: selectedApp !== 'All' ? selectedApp : '' }}
              />
              <GrafanaChart
                title="Disk Utilization Trends"
                panelId={2}
                variables={{ environment: selectedEnvironment !== 'All' ? selectedEnvironment : '', application: selectedApp !== 'All' ? selectedApp : '' }}
              />
              <GrafanaChart
                title="Memory Usage Trends"
                panelId={3}
                variables={{ environment: selectedEnvironment !== 'All' ? selectedEnvironment : '', application: selectedApp !== 'All' ? selectedApp : '' }}
              />
              <GrafanaChart
                title="CPU Temperature Trends"
                panelId={4}
                variables={{ environment: selectedEnvironment !== 'All' ? selectedEnvironment : '', application: selectedApp !== 'All' ? selectedApp : '' }}
              />
            </div>
          </>
        )}

        {activeTab === "metrics" && (
          <>
            <h2 className="text-xl font-bold mb-4">Server Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serverMetrics.map((metric, index) => (
                <ServerMetricsCard 
                  key={`${metric.server}-${metric.environment}`} 
                  metric={metric} 
                  index={index} 
                />
              ))}
            </div>
          </>
        )}

        {activeTab === "logs" && (
          <div className="logs-section">
            <h2 className="text-xl font-bold mb-4">Application Logs</h2>
            {loading ? (
              <p>Loading logs...</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-white rounded shadow p-4 border-l-4 cursor-pointer ${
                      log.level === "ERROR"
                        ? "border-red-500"
                        : log.level === "WARNING"
                        ? "border-yellow-500"
                        : "border-gray-300"
                    }`}
                    onClick={() => {
                      if (!log.id) return;
                      setSelectedLogId(log.id);
                      fetchLogAnalysis(log.id);
                    }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs text-gray-400">{log.timestamp}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          log.level === "ERROR"
                            ? "bg-red-100 text-red-700"
                            : log.level === "WARNING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-xs text-gray-500">{log.source}</span>
                      <span className="text-xs text-blue-500">{log.environment}</span>
                      <span className="text-xs text-green-500">{log.app_name}</span>
                      <span className="text-xs text-purple-700">
                        {getGlobalServerName(log.server, log.environment)}
                      </span>
                    </div>
                    <div className="text-sm">{log.message}</div>
                    {log.exception_type && (
                      <div className="mt-2 text-xs text-red-700">
                        <strong>{log.exception_type}:</strong> {log.exception_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <FloatingChatbot />
      {/* Alerts Popup */}
      {isAlertPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setIsAlertPopupOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold mb-4">Alerts</h3>
            {alerts.length === 0 ? (
              <p className="text-gray-600">No alerts.</p>
            ) : (
              <ul className="space-y-3">
                {alerts.map((alert, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {alert.type === "error" ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-1" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1" />
                    )}
                    <div>
                      <div className="font-semibold">{alert.title}</div>
                      <div className="text-sm text-gray-700">{alert.message}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {/* Log Analysis Popup */}
      {showAnalysisPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowAnalysisPopup(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold mb-4">LLM Log Analysis</h3>
            {analysisLoading ? (
              <div>Loading...</div>
            ) : logAnalysis?.error ? (
              <div className="text-red-600">{logAnalysis.error}</div>
            ) : (
              <div>
                <div className="mb-2"><b>Issue:</b> {logAnalysis.issue}</div>
                <div className="mb-2"><b>Impact:</b> {logAnalysis.impact}</div>
                <div className="mb-2"><b>Resolution:</b> {logAnalysis.resolution}</div>
                <div className="mb-2"><b>Commands:</b>
                  <ul className="list-disc ml-6">
                    {(logAnalysis.commands || []).map((cmd, idx) => (
                      <li key={idx}><code>{cmd}</code></li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
