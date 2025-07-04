# Infrastructure Monitor

A comprehensive React.js application for monitoring infrastructure with real-time metrics, server monitoring, network analysis, and application logs. Features MongoDB integration and LLM-generated insights.

## Features

- **Real-time Dashboard**: Overview of system health and performance metrics
- **Server Metrics**: CPU, memory, disk, and temperature monitoring
- **Network Metrics**: Traffic analysis and connectivity monitoring
- **Application Logs**: Real-time log viewing with search and filtering
- **Environment Filtering**: Filter by environment and application
- **Dark Mode**: Toggle between light and dark themes
- **AI-Powered Insights**: LLM-generated performance summaries and analysis
- **Interactive Chat Bot**: Infrastructure monitoring assistant
- **Grafana Integration**: Embedded charts and visualizations

## Tech Stack

### Frontend
- React.js 18
- Tailwind CSS
- Lucide React Icons
- Axios for API calls

### Backend
- Python Flask
- MongoDB with PyMongo
- Flask-CORS for cross-origin requests

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- MongoDB

### Frontend Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Install Tailwind CSS:
\`\`\`bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
\`\`\`

3. Start the development server:
\`\`\`bash
npm start
\`\`\`

The React app will be available at `http://localhost:3001`

### Backend Setup

1. Install Python dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your MongoDB connection details
\`\`\`

3. Start the Flask server:
\`\`\`bash
python main.py
\`\`\`

The API will be available at `http://localhost:5000`

### MongoDB Setup

1. Start MongoDB service:
\`\`\`bash
mongod
\`\`\`

2. (Optional) Insert sample data:
\`\`\`bash
curl -X POST http://localhost:5000/api/sample-data
\`\`\`

## API Endpoints

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/performance-summary` - AI-generated performance summary
- `GET /api/servers/metrics` - Server metrics data
- `GET /api/network/metrics` - Network metrics and logs
- `GET /api/logs/app` - Application logs with filtering
- `GET /api/environments` - Available environments and applications
- `GET /api/alerts` - System alerts
- `POST /api/sample-data` - Insert sample data for testing
- `GET /health` - Health check endpoint

## Environment Variables

Create a `.env` file in the root directory:

\`\`\`
MONGO_URI=mongodb://localhost:27017/
DATABASE_NAME=infrastructure_monitor
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GRAFANA_URL=http://localhost:3000
\`\`\`

## MongoDB Collections

The application uses the following MongoDB collections:

- `servers` - Server metrics and health data
- `logs` - Application logs
- `network_logs` - Network traffic logs
- `alerts` - System alerts
- `environments` - Environment and application configurations

## Features Overview

### Dashboard
- Real-time system statistics
- AI-generated performance summaries with LLM badges
- Critical server alerts with click-to-navigate functionality
- Grafana chart integration

### Server Metrics
- Individual server performance cards
- CPU, memory, disk, and temperature monitoring
- Critical server highlighting and analysis
- AI-powered issue analysis with LLM badges

### Network Metrics
- Network traffic statistics
- Request success/failure rates
- Response time analysis
- Bandwidth monitoring

### Application Logs
- Real-time log streaming
- Search and filter capabilities
- Log level filtering (ERROR, WARNING, INFO)
- Detailed log analysis with stack traces
- LLM-powered root cause analysis

### Environment Management
- Multi-environment support (Development, Staging, Production)
- Application-specific filtering
- Dynamic environment and application discovery

### User Interface
- Responsive design for desktop and mobile
- Dark/light mode toggle
- Interactive alerts system
- Floating chat assistant
- Grafana chart embedding

## Development

### Project Structure
\`\`\`
infrastructure-monitor/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Layout.js
│   │   ├── EnvironmentSelector.js
│   │   └── GrafanaChart.js
│   ├── pages/
│   │   ├── Overview.js
│   │   ├── ServerMetrics.js
│   │   ├── NetworkMetrics.js
│   │   └── AppLogs.js
│   ├── App.js
│   ├── client.js
│   ├── index.js
│   ├── App.css
│   └── index.css
├── main.py
├── requirements.txt
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
\`\`\`

### Adding New Features

1. **Frontend Components**: Add new React components in the `src/components/` directory
2. **API Endpoints**: Add new Flask routes in `main.py`
3. **Database Collections**: Define new MongoDB collections as needed
4. **Styling**: Use Tailwind CSS classes for consistent styling

### Testing

Test the API endpoints:
\`\`\`bash
# Health check
curl http://localhost:5000/health

# Get dashboard stats
curl "http://localhost:5000/api/dashboard/stats?environment=Production&app=app1"

# Insert sample data
curl -X POST http://localhost:5000/api/sample-data
\`\`\`

## Deployment

### Production Build

1. Build the React app:
\`\`\`bash
npm run build
\`\`\`

2. Configure production environment variables

3. Deploy the Flask API to your preferred hosting service

4. Ensure MongoDB is accessible from your production environment

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
2. **CORS Issues**: Verify Flask-CORS is properly configured
3. **API Timeout**: Check if the Flask server is running on the correct port
4. **Missing Dependencies**: Run `npm install` and `pip install -r requirements.txt`

### Logs

- Frontend: Check browser console for React errors
- Backend: Check Flask server logs for API errors
- Database: Check MongoDB logs for connection issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
\`\`\`

```text file=".gitignore"
# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt

# Production build
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# MongoDB
*.db

# Temporary files
*.tmp
*.temp
