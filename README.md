# TES Dashboard

[![license][badge-license]][badge-url-license]
[![chat][badge-chat]][badge-url-chat]

A comprehensive, modern dashboard for monitoring and managing Task Execution Service (TES) instances and workflow execution across federated cloud infrastructures. Built as part of the [**ELIXIR Cloud**][res-elixir-cloud] ecosystem, this dashboard provides real-time insights into distributed computing resources and seamless task management capabilities.

## ✨ Features

### 🔍 **Service Monitoring**
- **Real-time Service Status**: Monitor health of TES gateway and all federated nodes
- **Network Topology Visualization**: Interactive map showing TES instances across the ELIXIR federation
- **Performance Metrics**: Response times, connectivity status, and service availability
- **Automated Health Checks**: Continuous monitoring with configurable refresh intervals

### 📊 **Task & Workflow Management**
- **Task Submission**: Submit and track computational tasks across the federation
- **Workflow Orchestration**: Support for CWL, Nextflow, and Snakemake workflows
- **Batch Processing**: Submit CWL, Nextflow, and Snakemake batch jobs
- **Real-time Task Tracking**: Monitor task progress, logs, and execution status

### 🛠 **Administrative Tools**
- **Node Management**: Add, remove, update, and test TES nodes in the federation
- **Instance Management**: View and manage TES instances and their locations
- **Middleware Manager**: Configure and monitor the middleware pipeline
- **Authentication System**: Secure admin access with session-based permissions

### 🎨 **Modern User Experience**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Interactive Components**: Rich data visualizations and intuitive navigation
- **Real-time Updates**: Live data refresh without page reloads

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** (for containerised deployment)
- **Python 3.9+** (for local backend development)
- **Node.js 18+** and **npm** (for local frontend development)
- **Git** for cloning the repository

### 🐳 Docker Deployment (Recommended)

Run both services with a single command:

```bash
# Build and start frontend + backend
docker compose up --build -d

# Follow logs
docker compose logs -f

# Stop services
docker compose down
```

This starts:
- 🌐 **Frontend Dashboard**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000

### 🔧 Local Development Setup

#### Backend (Flask API)
```bash
cd backend
cp .env.example .env          # configure environment variables
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```
The backend will be available at `http://localhost:8000`

#### Frontend (React App)
```bash
cd frontend
npm install
npm start
```
The frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
tes-dashboard/
├── README.md
├── docker-compose.yml                   # Single-command deployment
├── backend/                             # Flask Backend API
│   ├── app.py                           # Application entry point & blueprint registration
│   ├── config.py                        # Configuration (env vars, CORS, paths)
│   ├── requirements.txt                 # Python dependencies
│   ├── .env.example                     # Environment variable template
│   ├── tes_instance_locations.json      # TES federation node geo-data
│   ├── .tes_instances                   # Persisted TES instance list
│   ├── Dockerfile                       # Development container image
│   ├── Dockerfile.production            # Hardened production image
│   ├── middleware_manager.py            # Middleware chain orchestration
│   ├── middleware_config.py             # Middleware configuration & wiring
│   ├── middleware_implementations.py    # Middleware implementations
│   ├── middleware/
│   │   └── middleware_api.py            # Middleware REST API blueprint
│   ├── routes/                          # Flask blueprints (one per domain)
│   │   ├── health.py                    # GET /api/health
│   │   ├── dashboard.py                 # GET /api/dashboard_data
│   │   ├── instances.py                 # /api/instances, /api/tes_locations, /api/service_info
│   │   ├── nodes.py                     # /api/nodes CRUD, /api/service_status
│   │   ├── tasks.py                     # /api/tasks, /api/submit_task
│   │   ├── workflows.py                 # /api/workflows, /api/submit_workflow
│   │   ├── batch.py                     # /api/batch_runs, /api/batch_cwl|nextflow|snakemake
│   │   ├── logs.py                      # /api/task_log, /api/workflow_log, /api/batch_log
│   │   └── network.py                   # /api/network_topology, /api/network_metrics
│   ├── services/                        # Business logic layer
│   │   ├── tes_service.py               # TES API interactions
│   │   ├── task_service.py              # Task operations & auto-updater
│   │   ├── workflow_service.py          # Workflow orchestration
│   │   └── batch_service.py             # Batch job processing
│   └── utils/
│       ├── tes_utils.py                 # TES utility functions
│       ├── file_utils.py                # File handling helpers
│       └── auth_utils.py               # Authentication helpers
├── frontend/                            # React Frontend Application
│   ├── package.json                     # Node.js dependencies
│   ├── nginx.conf                       # Nginx config (proxies /api → backend)
│   ├── server.js                        # Express server for k8s deployments
│   ├── Dockerfile                       # Development container image
│   ├── Dockerfile.production            # Hardened production image
│   ├── public/                          # Static assets (index.html, icons, manifest)
│   └── src/
│       ├── App.js                       # Router & top-level layout
│       ├── components/
│       │   ├── MiddlewareManager.js     # Middleware manager component
│       │   ├── auth/
│       │   │   ├── AdminLogin.js        # Admin login form
│       │   │   └── ProtectedRoute.js    # Route guard for admin pages
│       │   └── common/
│       │       ├── Header.js            # Top navigation bar
│       │       ├── Sidebar.js           # Side navigation
│       │       ├── ServiceStatus.js     # Service status widget
│       │       ├── ServiceStatusIndicator.js
│       │       ├── LoadingSpinner.js
│       │       └── ErrorMessage.js
│       ├── contexts/
│       │   └── AuthContext.js           # Global auth state
│       ├── hooks/
│       │   ├── useInstances.js          # TES instance data hook
│       │   └── usePolling.js            # Generic polling hook
│       ├── pages/
│       │   ├── Dashboard.js             # Main overview dashboard
│       │   ├── Tasks.js                 # Task list & management
│       │   ├── TaskDetails.js           # Individual task detail view
│       │   ├── SubmitTask.js            # Task submission form
│       │   ├── Workflows.js             # Workflow list & submission
│       │   ├── BatchProcessing.js       # Batch job submission
│       │   ├── BatchRuns.js             # Batch run history
│       │   ├── Logs.js                  # Task / workflow / batch log viewer
│       │   ├── NetworkTopology.js       # Network topology visualisation
│       │   ├── NetworkTopologyPage.tsx  # Network topology page wrapper
│       │   ├── RealTimeNetworkTopology.tsx # Live network topology
│       │   ├── NodeManagement.js        # Admin: manage TES nodes
│       │   ├── InstanceManagement.js    # TES instance management
│       │   ├── MiddlewareManager.js     # Middleware configuration page
│       │   ├── ServiceInfo.js           # TES service info viewer
│       │   ├── SystemStatus.js          # System-wide status overview
│       │   ├── Utilities.js             # Service health & utilities
│       │   ├── Settings.js              # Application settings
│       │   └── ApiTest.js              # API connectivity tester
│       ├── services/                    # API client layer
│       │   ├── api.js                   # Axios instance & base URL config
│       │   ├── taskService.js           # Task API calls
│       │   ├── workflowService.js       # Workflow API calls
│       │   ├── batchService.js          # Batch API calls
│       │   ├── instanceService.js       # Instance API calls
│       │   ├── logService.js            # Log API calls
│       │   ├── serviceInfoService.js    # TES service info calls
│       │   ├── serviceService.js        # General service calls
│       │   ├── serviceStatusService.js  # Service status polling
│       │   ├── statusService.js         # System status calls
│       │   └── mapService.js            # Map/geo data service
│       ├── styles/
│       │   └── MiddlewareManager.css
│       └── utils/
│           ├── constants.js             # App-wide constants
│           ├── formatters.js            # Data formatting helpers
│           ├── helpers.js               # General helper functions
│           └── validators.js            # Input validation
└── test-data/                           # Sample payloads for manual testing
    ├── config.json
    ├── sample-data.csv
    ├── sample-input.txt
    ├── tasks/                           # Example TES task JSON payloads
    │   ├── hello-world-task.json
    │   ├── data-processing-task.json
    │   ├── bioinformatics-analysis.json
    │   └── gpu-ml-training.json
    ├── batch-processing/                # Example batch submission payloads
    │   ├── hello-world-batch.json
    │   ├── data-analysis-batch.json
    │   ├── genomics-pipeline-batch.json
    │   └── ml-hyperparameter-batch.json
    └── workflows/                       # Example workflow definitions
        ├── hello-world.cwl
        ├── data-processing.cwl
        ├── hello-world.nf
        ├── rna-seq-analysis.nf
        ├── Snakefile
        ├── bioinformatics-pipeline.smk
        └── config.yaml
```

## ⚙️ Configuration

### Backend

Copy `.env.example` to `.env` in the `backend/` directory and fill in your values:

```env
SECRET_KEY=your-secret-key-here
FLASK_ENV=development

# TES gateway credentials (optional)
FUNNEL_SERVER_USER=
FUNNEL_SERVER_PASSWORD=
TES_TOKEN=
TES_GATEWAY=
```

### TES Federation Nodes

Add or edit nodes in `backend/tes_instance_locations.json`:

```json
{
  "id": "my-tes-node",
  "name": "My TES Node",
  "url": "https://my-tes-node.example.com",
  "country": "My Country",
  "lat": 40.7128,
  "lng": -74.0060,
  "status": "healthy",
  "description": "My TES instance description"
}
```

## 🔌 API Reference

### Health
```http
GET  /api/health                          # Backend health check
```

### Dashboard & Instances
```http
GET  /api/dashboard_data                  # Aggregated dashboard data
GET  /api/instances                       # All TES instances
GET  /api/tes_locations                   # Instance geo-locations
GET  /api/healthy-instances               # Healthy instances only
GET  /api/service_info?tes_url=<url>      # Service info for a specific instance
```

### Nodes
```http
GET    /api/nodes                         # List nodes
POST   /api/nodes                         # Add a node
GET    /api/nodes/<id>                    # Get node details
PUT    /api/nodes/<id>                    # Update a node
DELETE /api/nodes/<id>                    # Remove a node
GET    /api/nodes/<id>/health             # Node health check
GET    /api/service_status                # All nodes service status
GET    /api/test_connection               # Test backend connectivity
```

### Tasks
```http
GET  /api/tasks                           # List tasks
POST /api/submit_task                     # Submit a new task
GET  /api/task_details?task_id=<id>&tes_url=<url>  # Task details
GET  /api/task_log/<task_id>              # Task logs
```

### Workflows
```http
GET  /api/workflows                       # List workflows
POST /api/submit_workflow                 # Submit a workflow (CWL/NF/Snakemake)
GET  /api/latest_workflow_status          # Latest workflow run status
GET  /api/workflow_log/<run_id>           # Workflow logs
```

### Batch
```http
GET  /api/batch_runs                      # Batch run history
POST /api/batch_cwl                       # Submit CWL batch
POST /api/batch_nextflow                  # Submit Nextflow batch
POST /api/batch_snakemake                 # Submit Snakemake batch
GET  /api/batch_log/<run_id>              # Batch run logs
```

### Network
```http
GET  /api/network_topology                # Full network topology
GET  /api/network_status                  # Network connectivity status
GET  /api/network_metrics                 # Aggregated network metrics
GET  /api/instance_metrics/<id>           # Per-instance metrics
GET  /api/data_transfers                  # Active data transfers
GET  /api/storage_locations               # Storage endpoint list
```

## 🐛 Troubleshooting

**TES instances not loading (Network Error)**
- When running via Docker Compose the frontend proxies `/api` requests through nginx to the backend container. Ensure `REACT_APP_API_URL` is left empty (the default) so the proxy is used.
- Verify both containers are running: `docker compose ps`
- Check backend logs: `docker compose logs tes-dashboard-backend-service`

**Backend container not healthy**
- The health check calls `GET /api/health`. Confirm the backend started without import errors: `docker compose logs tes-dashboard-backend-service`

**Admin login not working**
- Default credentials: `tesadmin` / `admin@dashboard`
- Check browser console for CORS errors — the backend must be reachable from the origin used by the browser.

**Frontend won't start locally**
- Requires Node.js 18+. Clear cached modules with `rm -rf node_modules && npm install`.

**Backend won't start locally**
- Requires Python 3.9+. Activate the virtual environment before running `python app.py`.

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to your branch: `git push origin feature/amazing-feature`
5. **Open** a pull request

