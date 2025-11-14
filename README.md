# TES Dashboard

[![license][badge-license]][badge-url-license]
[![chat][badge-chat]][badge-url-chat]

A comprehensive, modern dashboard for monitoring and managing Task Execution Service (TES) instances and workflow execution across federated cloud infrastructures. Built as part of the [**ELIXIR Cloud**][res-elixir-cloud] ecosystem, this dashboard provides real-time insights into distributed computing resources and seamless task management capabilities.

## ✨ Features

### 🔍 **Service Monitoring**
- **Real-time Service Status**: Monitor health of TES gateway and all federated nodes
- **Network Topology Visualization**: Interactive map showing TES instances across ELIXIR federation
- **Performance Metrics**: Response times, connectivity status, and service availability
- **Automated Health Checks**: Continuous monitoring with 3-second refresh intervals

### 📊 **Task & Workflow Management**
- **Task Submission**: Submit and track computational tasks across the federation
- **Workflow Orchestration**: Support for CWL, Nextflow, and Snakemake workflows
- **Batch Processing**: Manage large-scale batch job submissions
- **Real-time Task Tracking**: Monitor task progress, logs, and execution status

### 🛠 **Administrative Tools**
- **Node Management**: Add, remove, and configure TES nodes in the federation
- **Service Administration**: Comprehensive control panel for system administrators
- **Authentication System**: Secure admin access with role-based permissions
- **Configuration Management**: Dynamic service configuration and monitoring

### 🎨 **Modern User Experience**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme Support**: Modern authentication interface with clean aesthetics
- **Interactive Components**: Rich data visualizations and intuitive navigation
- **Real-time Updates**: Live data refresh without page reloads

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (recommended: 3.9 or higher)
- **Node.js 16+** (recommended: 18 LTS or higher)
- **npm** or **yarn** package manager
- **Git** for cloning the repository

### 🏃‍♂️ One-Command Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/elixir-cloud-aai/elixir-cloud-demos.git
   cd elixir-cloud-demos
   ```

2. Start the complete dashboard:
   ```bash
   ./run.sh
   ```

   The startup script will:
   - ✅ Create and activate Python virtual environment
   - ✅ Install all backend dependencies
   - ✅ Install all frontend dependencies  
   - ✅ Start Flask backend server on `http://localhost:8000`
   - ✅ Start React development server on `http://localhost:3000`

3. **Open your browser** and navigate to:
   - 🌐 **Frontend Dashboard**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:8000

### 🔧 Manual Setup

If you prefer to run the services separately:

#### Backend (Flask API)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
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

### 🐳 Docker Deployment

Build and run with Docker:

```bash
# Build images
./build-and-push-images.sh

# Deploy with Docker Compose (if available)
docker-compose up -d
```

### ☸️ Kubernetes Deployment

Deploy to Kubernetes:

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Or use the deployment script
./deploy.sh
```

## 📁 Project Structure

```
elixir-cloud-demos/
├── 📄 README.md                    # This file
├── 📄 LICENSE                      # Apache 2.0 license
├── 🔧 run.sh                       # One-command startup script
├── 🔧 build.sh                     # Build script
├── 🔧 deploy.sh                    # Deployment script
├── 📁 backend/                     # Flask Backend API
│   ├── app.py                      # Main Flask application
│   ├── requirements.txt            # Python dependencies
│   ├── tes_instance_locations.json # TES federation configuration
│   ├── Dockerfile                  # Backend container image
│   └── uploads/                    # File upload directory
├── 📁 frontend/                    # React Frontend Application
│   ├── package.json                # Node.js dependencies
│   ├── Dockerfile                  # Frontend container image
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── auth/               # Authentication components
│   │   │   ├── charts/             # Data visualization
│   │   │   ├── common/             # Shared components
│   │   │   ├── forms/              # Input forms
│   │   │   ├── logs/               # Log viewing
│   │   │   └── tables/             # Data tables
│   │   ├── pages/                  # Application pages
│   │   │   ├── Dashboard.js        # Main dashboard
│   │   │   ├── Utilities.js        # Service status monitoring
│   │   │   ├── NodeManagement.js   # Admin node management
│   │   │   ├── Tasks.js            # Task management
│   │   │   ├── Workflows.js        # Workflow management
│   │   │   └── NetworkTopology.js  # Network visualization
│   │   ├── contexts/               # React contexts
│   │   │   └── AuthContext.js      # Authentication state
│   │   ├── services/               # API communication
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── utils/                  # Utility functions
│   │   └── styles/                 # CSS stylesheets
│   └── public/                     # Static assets
├── 📁 k8s/                         # Kubernetes Deployments
│   ├── backend-deployment.yaml     # Backend K8s config
│   ├── frontend-deployment.yaml    # Frontend K8s config
│   ├── complete-deployment.yaml    # Full stack deployment
│   └── ingress.yaml                # Ingress configuration
└── 📁 uploads/                     # Upload directory
    └── batch_runs.json             # Sample batch data
```

## 🎯 Key Components

### Backend API (`/backend`)
- **Flask REST API** with comprehensive TES management endpoints
- **Service Health Monitoring** with real-time status checks
- **Node Management API** for federated TES network administration
- **Batch Processing** support for large-scale job submissions
- **CORS-enabled** for seamless frontend integration

### Frontend Dashboard (`/frontend`)
- **React 18** with modern hooks and context API
- **Styled Components** for component-scoped styling
- **Axios** for HTTP client communication
- **Lucide React** for consistent iconography
- **Responsive Design** with mobile-first approach

### Authentication System
- **Admin Authentication** with session management
- **Protected Routes** for administrative functions
- **Role-based Access** for sensitive operations
- **24-hour Sessions** with automatic logout

## 📖 Usage Guide

### 🔍 **Service Status Monitoring**

Navigate to **Utilities → Service Status** to monitor the health of your TES federation:

- **Gateway Status**: Monitor the main TES gateway service
- **Node Health**: Real-time status of all federated TES nodes  
- **Response Times**: Performance metrics for each service
- **Auto-refresh**: Status updates every 3 seconds while viewing

### 👥 **Node Management** (Admin Only)

Access **Administration → Node Management** to manage your TES federation:

1. **Login**: Use admin credentials (`tesadmin` / `admin@dashboard`)
2. **Add Nodes**: Configure new TES instances in the federation
3. **Test Connectivity**: Verify node health and connectivity
4. **Remove Nodes**: Safely remove outdated or offline nodes

### 📊 **Task & Workflow Management**

- **Submit Tasks**: Use the task submission interface for individual jobs
- **Batch Processing**: Submit multiple jobs with batch processing
- **Monitor Progress**: Track task execution in real-time
- **View Logs**: Access detailed execution logs and error messages

### 🌐 **Network Topology**

Visualize your TES federation:
- **Geographic View**: See TES nodes distributed across regions
- **Connection Status**: Monitor network connectivity between nodes
- **Performance Metrics**: View latency and throughput statistics

## ⚙️ Configuration

### Backend Configuration

The backend can be configured through environment variables:

```bash
# Backend configuration
export TES_GATEWAY_URL="http://localhost:8000"
export FLASK_ENV="development"  # or "production"
export CORS_ORIGINS="http://localhost:3000"
```

### TES Federation Setup

Configure your TES instances in `backend/tes_instance_locations.json`:

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

### Frontend Configuration

Frontend settings in `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_REFRESH_INTERVAL=30000
```

## 🔌 API Documentation

### Service Status Endpoints

```http
GET /api/service-status        # Get all service statuses
GET /api/service-health/{id}   # Get specific service health
GET /api/nodes                 # List all TES nodes
```

### Node Management Endpoints

```http
POST /api/nodes                # Add new TES node
PUT /api/nodes/{id}            # Update TES node
DELETE /api/nodes/{id}         # Remove TES node
GET /api/nodes/{id}/test       # Test node connectivity
```

### Task Management Endpoints

```http
GET /api/tasks                 # List tasks
POST /api/tasks                # Submit new task
GET /api/tasks/{id}            # Get task details
GET /api/tasks/{id}/logs       # Get task logs
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
./test-integration.sh
```

## 🛠 Development

### Adding New Pages

1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.js`
3. Update navigation in `frontend/src/components/common/Sidebar.js`

### Adding New API Endpoints

1. Add endpoint in `backend/app.py`
2. Create service function in `frontend/src/services/`
3. Use service in React components

### Styling Guidelines

- Use **Styled Components** for component styling
- Follow **mobile-first** responsive design
- Use **Lucide React** icons for consistency
- Maintain **dark theme** support

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (3.8+ required)
- Verify virtual environment activation
- Install dependencies: `pip install -r requirements.txt`

**Frontend won't start:**
- Check Node.js version (16+ required)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 3000 availability

**Service status shows all offline:**
- Verify backend is running on port 8000
- Check CORS configuration
- Validate TES node URLs in configuration

**Admin login not working:**
- Use credentials: `tesladmin` / `admin@dashboard`
- Check browser local storage
- Clear browser cache if needed

## 📈 Performance Optimization

### Backend Optimization

- Use **connection pooling** for TES node communications
- Implement **caching** for service status responses
- Add **rate limiting** for API endpoints
- Use **async/await** for concurrent node health checks

### Frontend Optimization

- Implement **React.memo** for expensive components
- Use **lazy loading** for pages and components
- Add **service worker** for offline functionality
- Optimize **bundle size** with code splitting

## 🔒 Security Considerations

### Authentication

- Admin sessions expire after 24 hours
- Passwords are validated client-side
- Consider implementing JWT tokens for production

### Network Security

- All TES communications use HTTPS in production
- CORS is properly configured for frontend-backend communication
- API rate limiting prevents abuse

### Data Protection

- No sensitive data stored in local storage
- All user inputs are sanitized
- TES node credentials handled securely

## 📚 Additional Resources

### TES Specification
- [GA4GH TES API](https://github.com/ga4gh/task-execution-schemas)
- [TES Implementation Guide](https://ga4gh.github.io/task-execution-schemas/)

### Elixir Cloud Documentation
- [Elixir Cloud Portal](https://elixir-cloud.dcc.sib.swiss/)
- [Federation Architecture](https://github.com/elixir-cloud-aai)

### Technology Stack Documentation
- [React Documentation](https://react.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Styled Components](https://styled-components.com/)

## 🤝 Contributing

We welcome contributions to the TES Dashboard! Here's how to get started:

### **How to Contribute**

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes and test thoroughly
5. **Commit** with descriptive messages: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Submit** a pull request

### **Contribution Guidelines**

- **Code Style**: Follow existing patterns and linting rules
- **Testing**: Add tests for new functionality
- **Documentation**: Update README and inline comments
- **Backwards Compatibility**: Ensure existing features still work

### **Reporting Bugs**

1. Check existing issues first
2. Provide detailed reproduction steps
3. Include system information (OS, browser, versions)
4. Add screenshots or logs if helpful

### **Feature Requests**

1. Describe the use case clearly
2. Explain the expected behavior
3. Consider implementation approaches
4. Discuss with maintainers first for large changes

