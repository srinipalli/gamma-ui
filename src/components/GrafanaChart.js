import React from 'react';

const GrafanaChart = ({
  title = 'Grafana Panel',
  dashboardId = 'ac8f6315-14f1-46ac-811b-b73797480fc8',
  slug = 'infra-charts',
  panelId = 1,
  from = 'now-6h',
  to = 'now',
  variables = {}, // e.g., { environment: 'Prod' }
  height = 400,
  width = '100%',
}) => {
  const grafanaUrl = 'http://localhost:3000';

  // Build the d-solo URL for embedding a single panel
  const baseUrl = `${grafanaUrl}/d-solo/${dashboardId}/${slug}`;
  const params = new URLSearchParams({
    orgId: '1',
    from,
    to,
    timezone: 'browser',
    panelId: panelId.toString(),
    theme: 'light',
  });

  // Add variables if provided
  Object.entries(variables).forEach(([key, value]) => {
    params.append(`var-${key}`, value);
  });

  const iframeUrl = `${baseUrl}?${params.toString()}`;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <iframe
        src={iframeUrl}
        width={width}
        height={height}
        frameBorder="0"
        title={title}
        className="rounded w-full"
        style={{ minHeight: height, background: '#fff' }}
        allowFullScreen
      />
    </div>
  );
};

export default GrafanaChart;
