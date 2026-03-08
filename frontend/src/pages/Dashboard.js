import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import api from "../services/api";
import { taskService } from "../services/taskService";
import { serviceStatusService } from "../services/serviceStatusService";
import usePolling from "../hooks/usePolling";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import { formatDate, formatTaskStatus } from "../utils/formatters";
import { TASK_STATE_COLORS } from "../utils/constants";
import {
  PlayCircle,
  CheckCircle,
  Link2,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Server,
} from "lucide-react";

const DashboardContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;
const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${(props) => props.color || "#007bff"};
  transition: all 0.2s ease;
  cursor: ${(props) => (props.clickable ? "pointer" : "default")};
  position: relative;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    ${(props) =>
      props.clickable &&
      `
      border-left-width: 6px;
    `}
`;
const StatHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;
const StatIcon = styled.div`
  margin-right: 12px;
  color: ${(props) => props.color || "#007bff"};
`;
const StatTitle = styled.h3`
  margin: 0;
  color: #333;
  font-weight: 600;
`;
const StatValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: ${(props) => props.color || "#333"};
  margin-bottom: 5px;
`;
const StatSubtext = styled.div`
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const ClickableHint = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  color: ${(props) => props.color || "#007bff"};
  opacity: 0.7;
  transition: opacity 0.2s ease;
  ${StatCard}:hover & {
    opacity: 1;
  }
`;
const RefreshButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 12px;
  &:hover {
    background: #0056b3;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
const ContentCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
`;
const CardTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  color: #333;
  font-weight: 600;
`;
const TasksList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;
const TaskItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #f8f9fa;
  }
  &:last-child {
    border-bottom: none;
  }
`;
const TaskInfo = styled.div`
  flex-grow: 1;
`;
const TaskId = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
`;
const TaskMeta = styled.div`
  font-size: 12px;
  color: #666;
`;
const TaskStatus = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background-color: ${(props) => TASK_STATE_COLORS[props.status] || "#6c757d"};
`;
const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 500;
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [allInstances, setAllInstances] = useState([]);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const [instancesError, setInstancesError] = useState(null);
  const loadAllInstances = useCallback(async () => {
    try {
      setInstancesLoading(true);
      setInstancesError(null);
      const response = await api.get("/api/instances-with-status");
      const instancesData = Array.isArray(response.data)
        ? response.data
        : response.data.instances || [];
      setAllInstances(instancesData);
    } catch (error) {
      setInstancesError("Failed to load instances");
      setAllInstances([]);
    } finally {
      setInstancesLoading(false);
    }
  }, []);
  const [apiHealth, setApiHealth] = useState({
    loading: true,
    healthy: 0,
    unhealthy: 0,
    total: 0,
    percentage: 100,
    status: "healthy",
    services: [],
    error: null,
    lastUpdated: null,
    loaded: false,
  });
  useEffect(() => {
    if (!instancesLoading) {
      const total = allInstances.length;
      const healthy = allInstances.filter((inst) => inst.status === "healthy").length;
      const unhealthy = total - healthy;
      const percentage = total > 0 ? Math.round((healthy / total) * 100) : 0;
      let status = "healthy";
      if (total === 0) {
        status = "unknown";
      } else if (unhealthy === total) {
        status = "error";
      } else if (unhealthy > 0) {
        status = "warning";
      }
      setApiHealth({
        loading: false,
        loaded: true,
        healthy,
        unhealthy,
        total,
        percentage,
        status,
        services: allInstances,
        lastUpdated: new Date().toISOString(),
        error: instancesError,
      });
    } else {
      setApiHealth((prev) => ({ ...prev, loading: true }));
    }
  }, [allInstances, instancesLoading, instancesError]);
  useEffect(() => {
    loadAllInstances();
    const interval = setInterval(loadAllInstances, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAllInstances]);
  const {
    data: combinedData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = usePolling(() => taskService.listTasks(), 3600000);
  let tasksData, dashboardData;
  if (Array.isArray(combinedData)) {
    tasksData = combinedData;
    dashboardData = null;
  } else if (combinedData && typeof combinedData === "object") {
    tasksData = combinedData.tasks || [];
    dashboardData = combinedData.dashboardData || null;
  } else {
    tasksData = [];
    dashboardData = null;
  }
  const tasksLoading = dashboardLoading;
  const tasksError = dashboardError;
  const refetchTasks = refetchDashboard;
  const handleRefresh = useCallback(() => {
    refetchDashboard();
    loadAllInstances();
  }, [refetchDashboard, loadAllInstances]);
  const [directDashboardData, setDirectDashboardData] = useState(null);
  useEffect(() => {
    const fetchDirectDashboardData = async () => {
      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || "";
        const url = apiBaseUrl
          ? `${apiBaseUrl}/api/dashboard_data`
          : "/api/dashboard_data";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setDirectDashboardData(data);
        }
      } catch (error) {}
    };
    fetchDirectDashboardData();
    const timer = setTimeout(fetchDirectDashboardData, 3600000);
    return () => clearTimeout(timer);
  }, []);
  const [serviceStatusSummary, setServiceStatusSummary] = useState({
    healthy: 0,
    total: 0,
    loading: true,
    error: null,
  });
  const loadServiceStatus = useCallback(async () => {
    setServiceStatusSummary((prev) => ({ ...prev, loading: true }));
    try {
      const data = await serviceStatusService.getServiceStatus();
      const healthy =
        Array.isArray(data.services) &&
        data.services.filter((s) => s.status === "healthy").length;
      const total =
        Array.isArray(data.services) && data.services.length;
      setServiceStatusSummary({
        healthy: healthy || 0,
        total: total || 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      setServiceStatusSummary({
        healthy: 0,
        total: 0,
        loading: false,
        error: error.message,
      });
    }
  }, []);
  useEffect(() => {
    loadServiceStatus();
  }, [loadServiceStatus]);
  const tasksArray = Array.isArray(tasksData) ? tasksData : [];
  if (dashboardLoading && !dashboardData) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }
  return (
    <DashboardContainer>
      <StatsGrid>
        <StatCard color="#28a745" clickable onClick={() => navigate("/tasks")}> 
          <StatHeader>
            <StatIcon color="#28a745">
              <PlayCircle size={24} />
            </StatIcon>
            <StatTitle>Running Tasks</StatTitle>
          </StatHeader>
          <StatValue color="#28a745">{tasksArray.filter((task) => task.state === "RUNNING").length}</StatValue>
          <StatSubtext>
            <span>Currently executing</span>
            <ClickableHint color="#28a745">
              View tasks <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </ClickableHint>
          </StatSubtext>
        </StatCard>
        <StatCard color="#007bff" clickable onClick={() => navigate("/workflows")}> 
          <StatHeader>
            <StatIcon color="#007bff">
              <CheckCircle size={24} />
            </StatIcon>
            <StatTitle>Running Workflows</StatTitle>
          </StatHeader>
          <StatValue color="#007bff">{directDashboardData?.workflow_runs?.length || 0}</StatValue>
          <StatSubtext>
            <span>Currently executing</span>
            <ClickableHint color="#007bff">
              View workflows <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </ClickableHint>
          </StatSubtext>
        </StatCard>
        <StatCard
          color={apiHealth.healthy === apiHealth.total && apiHealth.total > 0 ? "#28a745" : "#dc3545"}
          clickable
          onClick={() => navigate("/utilities")}
        >
          <StatHeader>
            <StatIcon color={apiHealth.healthy === apiHealth.total && apiHealth.total > 0 ? "#28a745" : "#dc3545"}>
              <Server size={24} />
            </StatIcon>
            <StatTitle>TES Instance Health</StatTitle>
          </StatHeader>
          <StatValue color={apiHealth.healthy === apiHealth.total && apiHealth.total > 0 ? "#28a745" : "#dc3545"}>
            {apiHealth.loading ? <LoadingSpinner size="small" /> : `${apiHealth.healthy}/${apiHealth.total}`}
          </StatValue>
          <StatSubtext>
            <span>Healthy Instances</span>
            <ClickableHint color={apiHealth.healthy === apiHealth.total && apiHealth.total > 0 ? "#28a745" : "#dc3545"}>
              TES Network <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </ClickableHint>
          </StatSubtext>
          {apiHealth.healthy < apiHealth.total && apiHealth.total > 0 && !apiHealth.loading && (
            <div style={{ color: "#dc3545", fontSize: 13, marginTop: 8, display: "flex", alignItems: "center" }}>
              <AlertTriangle size={16} style={{ marginRight: 6 }} />
              Not all TES instances are available
            </div>
          )}
        </StatCard>
        <StatCard
          color={serviceStatusSummary.healthy === serviceStatusSummary.total && serviceStatusSummary.total > 0 ? "#28a745" : "#dc3545"}
          clickable
          onClick={() => navigate("/api/service-info")}
        >
          <StatHeader>
            <StatIcon color={serviceStatusSummary.healthy === serviceStatusSummary.total && serviceStatusSummary.total > 0 ? "#28a745" : "#dc3545"}>
              <Link2 size={24} />
            </StatIcon>
            <StatTitle>Connection Status</StatTitle>
          </StatHeader>
          <StatValue color={serviceStatusSummary.healthy === serviceStatusSummary.total && serviceStatusSummary.total > 0 ? "#28a745" : "#dc3545"}>
            {serviceStatusSummary.loading ? <LoadingSpinner size="small" /> : `${serviceStatusSummary.healthy}/${serviceStatusSummary.total}`}
          </StatValue>
          <StatSubtext>
            <span>Service Status</span>
            <ClickableHint color={serviceStatusSummary.healthy === serviceStatusSummary.total && serviceStatusSummary.total > 0 ? "#28a745" : "#dc3545"}>
              Diagnostics <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </ClickableHint>
          </StatSubtext>
          {serviceStatusSummary.healthy < serviceStatusSummary.total && serviceStatusSummary.total > 0 && !serviceStatusSummary.loading && (
            <div style={{ color: "#dc3545", fontSize: 13, marginTop: 8, display: "flex", alignItems: "center" }}>
              <AlertTriangle size={16} style={{ marginRight: 6 }} />
              Not all services are available
            </div>
          )}
          {serviceStatusSummary.error && (
            <div style={{ color: "#dc3545", fontSize: 13, marginTop: 8, display: "flex", alignItems: "center" }}>
              <AlertTriangle size={16} style={{ marginRight: 6 }} />
              {serviceStatusSummary.error}
            </div>
          )}
        </StatCard>
      </StatsGrid>
      <ContentGrid>
        <ContentCard>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <RefreshButton onClick={refetchTasks} disabled={tasksLoading}>
              <RefreshCw size={14} style={{ marginRight: "5px" }} />
              Refresh
            </RefreshButton>
          </CardHeader>
          {tasksError && <ErrorMessage error={tasksError} />}
          {tasksLoading && (
            <LoadingSpinner size="small" text="Loading tasks..." />
          )}
          {tasksArray && tasksArray.length > 0 ? (
            <TasksList>
              {tasksArray.slice(0, 10).map((task, index) => (
                <TaskItem key={task.id || index}>
                  <TaskInfo>
                    <TaskId>{task.id || `Task ${index + 1}`}</TaskId>
                    <TaskMeta>
                      Created: {formatDate(task.creation_time)} | TES: {task.tes_url || "Unknown"}
                    </TaskMeta>
                  </TaskInfo>
                  <TaskStatus status={task.state}>
                    {formatTaskStatus(task.state)}
                  </TaskStatus>
                </TaskItem>
              ))}
            </TasksList>
          ) : (
            <EmptyState>No tasks found</EmptyState>
          )}
        </ContentCard>
        <ContentCard>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <RefreshButton onClick={handleRefresh}>
              <RefreshCw size={14} style={{ marginRight: "5px" }} />
              Refresh
            </RefreshButton>
          </CardHeader>
          {dashboardError && <ErrorMessage error={dashboardError} />}
          {dashboardData && (
            <div>
              <div style={{ marginBottom: "15px" }}>
                <strong>TES Instances Available:</strong> {directDashboardData?.instances_count || 0}
              </div>
              <div style={{ marginBottom: "15px" }}>
                <strong>TES Gateway:</strong> {dashboardData.tes_gateway || "Not configured"}
              </div>
              <div style={{ marginBottom: "15px" }}>
                <strong>Workflow Runs:</strong> {directDashboardData?.workflow_runs?.length || 0}
              </div>
              <div style={{ marginBottom: "15px" }}>
                <strong>Latest Path:</strong> {dashboardData.latest_path?.join(", ") || "None"}
              </div>
              <div style={{ marginBottom: "15px" }}>
                <strong>Instance Source:</strong> Dashboard Data with Fresh Instances
              </div>
              <div>
                <strong>Last Updated:</strong> {formatDate(new Date())}
              </div>
            </div>
          )}
        </ContentCard>
      </ContentGrid>
    </DashboardContainer>
  );
};

export default Dashboard;
