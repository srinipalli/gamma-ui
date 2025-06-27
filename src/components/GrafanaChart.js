const GrafanaChart = ({
  title = "Grafana Panel",
  dashboardId = "ac8f6315-14f1-46ac-811b-b73797480fc8",
  slug = "infra-charts",
  panelId = 1,
  from = "now-6h",
  to = "now",
  variables = {},
  height = 400,
  width = "100%",
  isDarkMode = false,
}) => {
  const grafanaUrl = process.env.REACT_APP_GRAFANA_URL || "http://localhost:3000"

  // Environment mapping - Frontend to Grafana/Prometheus values
  const environmentMapping = {
    "Development": "Dev",
    "Staging": "Stage", 
    "Production": "Prod",
    "QA": "QA"
  }

  const baseUrl = `${grafanaUrl}/d-solo/${dashboardId}/${slug}`
  const params = new URLSearchParams({
    orgId: "1",
    from,
    to,
    timezone: "browser",
    panelId: panelId.toString(),
    theme: isDarkMode ? "dark" : "light",
  })

  // Apply environment mapping to variables
  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      let mappedValue = value
      
      // Apply environment mapping if this is an environment variable
      if (key === 'environment' || key === 'environments') {
        mappedValue = environmentMapping[value] || value
      }
      
      params.append(`var-${key}`, mappedValue)
    }
  })

  const iframeUrl = `${baseUrl}?${params.toString()}`

  return (
    <div className={`rounded-lg shadow p-4 transition-colors duration-300 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
      <iframe
        src={iframeUrl}
        width={width}
        height={height}
        frameBorder="0"
        title={title}
        className="rounded w-full"
        style={{ minHeight: height, background: isDarkMode ? "#1f2937" : "#fff" }}
        allowFullScreen
      />
    </div>
  )
}

export default GrafanaChart
