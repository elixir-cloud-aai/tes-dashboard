import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import api, { testConnection, fetchDashboardData } from "../services/api";
import { taskService } from "../services/taskService";
import { serviceInfoService } from "../services/serviceInfoService";
import { workflowService } from "../services/workflowService";
import { batchService } from "../services/batchService";
import { mapService } from "../services/mapService";
import { logService } from "../services/logService";
import usePolling from "../hooks/usePolling";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import { formatDate, formatTaskStatus } from "../utils/formatters";
import { TASK_STATE_COLORS, WORKFLOW_STATE_COLORS } from "../utils/constants";
import {
  PlayCircle,
  CheckCircle,
  Activity,
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
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid ${(props) => props.color || "#007bff"};
  transition: all 0.3s ease;
  ${(props) => props.clickable && `cursor: pointer;`}

  &:hover {
    ${(props) =>
      props.clickable &&
      `
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `}
  }
`;
const StatHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;
const StatIcon = styled.div`
  color: ${(props) => props.color || "#007bff"};
  margin-right: 10px;
`;
const StatTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #6c757d;
  margin: 0;
`;
const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${(props) => props.color || "#007bff"};
  margin-bottom: 8px;
`;
const StatSubtext = styled.div`
  font-size: 13px;
  color: #6c757d;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const ClickableHint = styled.span`
  color: ${(props) => props.color || "#007bff"};
  font-weight: 500;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${StatCard}:hover & {
    opacity: 1;
  }
`;
const RefreshButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: #0056b3;
    transform: translateY(-1px);
  }
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
`;
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
const ContentCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
`;
const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #343a40;
  margin: 0;
`;
const TasksList = styled.div`
  display: flex;
  flex-direction: column;
`;
const WorkflowsList = styled.div`
  display: flex;
  flex-direction: column;
`;
const TaskItem = styled.div`
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: #f8f9fa;
    border-color: #007bff;
  }
  &:last-child {
    margin-bottom: 0;
  }
`;
const WorkflowItem = styled.div`
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: #f8f9fa;
    border-color: #007bff;
  }
  &:last-child {
    margin-bottom: 0;
  }
`;
const TaskInfo = styled.div`
  flex: 1;
`;
const WorkflowInfo = styled.div`
  flex: 1;
`;
const TaskId = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #343a40;
  margin-bottom: 4px;
`;
const WorkflowId = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #343a40;
  margin-bottom: 4px;
`;
const TaskMeta = styled.div`
  font-size: 12px;
  color: #6c757d;
`;
const WorkflowMeta = styled.div`
  font-size: 12px;
  color: #6c757d;
`;
const TaskStatus = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${(props) => TASK_STATE_COLORS[props.status] || "#6c757d"};
  color: white;
`;
const WorkflowStatus = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${(props) =>
    WORKFLOW_STATE_COLORS[props.status] || "#6c757d"};
  color: white;
`;
const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-size: 14px;
  background: #f8f9fa;
  border-radius: 8px;
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
      const healthy = allInstances.filter(
        (inst) => inst.status && inst.status.toLowerCase() === "healthy",
      ).length;
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
  } = usePolling(() => fetchDashboardData(), 60000);

  let tasksData, dashboardData;
  if (combinedData) {
    tasksData = combinedData.tasks;
    dashboardData = combinedData;
  }

  const {
    data: tasksData2,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = usePolling(() => taskService.listTasks(), 30000);

  const {
    data: workflowsData,
    loading: workflowsLoading,
    error: workflowsError,
    refetch: refetchWorkflows,
  } = usePolling(() => workflowService.getWorkflowRuns(), 30000);

  const handleRefresh = () => {
    refetchDashboard();
    refetchTasks();
    refetchWorkflows();
  };

  const [directDashboardData, setDirectDashboardData] = useState(null);

  const fetchDirectDashboardData = useCallback(async () => {
    try {
      const apiBaseUrl =
        process.env.REACT_APP_API_BASE_URL || window.location.origin;
      const url = apiBaseUrl.includes("localhost")
        ? "http://localhost:8000/api/dashboard_data"
        : `${apiBaseUrl}/api/dashboard_data`;
      const response = await fetch(url);
      const data = await response.json();
      setDirectDashboardData(data);
    } catch (error) {}
  }, []);

  useEffect(() => {
    fetchDirectDashboardData();
    const timer = setTimeout(fetchDirectDashboardData, 3600000);
    return () => clearTimeout(timer);
  }, [fetchDirectDashboardData]);

  // API Test Summary - runs quick diagnostic tests
  const [apiTestSummary, setApiTestSummary] = useState({
    passing: 0,
    total: 9,
    loading: true,
    error: null,
  });

  const runQuickApiTests = useCallback(async () => {
    setApiTestSummary((prev) => ({ ...prev, loading: true }));
    let passingTests = 0;
    const totalTests = 9;

    // Test 1: Basic connection
    try {
      await testConnection();
      passingTests++;
    } catch (error) {}

    // Test 2: Dashboard data
    try {
      await fetchDashboardData();
      passingTests++;
    } catch (error) {}

    // Test 3: Task service
    try {
      await taskService.listTasks();
      passingTests++;
    } catch (error) {}

    // Test 4: Service info
    try {
      const dashboardData = await fetchDashboardData();
      const tesInstances = dashboardData.tes_instances || [];
      if (tesInstances.length > 0) {
        await serviceInfoService.getServiceInfo(tesInstances[0].url);
        passingTests++;
      }
    } catch (error) {}

    // Test 5: TES locations
    try {
      await mapService.getTesLocations();
      passingTests++;
    } catch (error) {}

    // Test 6: Batch runs
    try {
      await batchService.getBatchRuns();
      passingTests++;
    } catch (error) {}

    // Test 7: Workflow runs
    try {
      await workflowService.getWorkflowRuns();
      passingTests++;
    } catch (error) {}

    // Test 8: Logs
    try {
      await logService.getTopologyLogs();
      passingTests++;
    } catch (error) {}

    // Test 9: Nodes
    try {
      await api.get("/api/nodes");
      passingTests++;
    } catch (error) {}

    setApiTestSummary({
      passing: passingTests,
      total: totalTests,
      loading: false,
      error: passingTests < totalTests ? "Some API tests failed" : null,
    });
  }, []);

  useEffect(() => {
    runQuickApiTests();
    // Re-run tests every 5 minutes
    const interval = setInterval(runQuickApiTests, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runQuickApiTests]);

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
          <StatValue color="#28a745">
            {tasksArray.filter((task) => task.state === "RUNNING").length}
          </StatValue>
          <StatSubtext>
            <span>Currently executing</span>
            <ClickableHint color="#28a745">
              View tasks <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </ClickableHint>
          </StatSubtext>
        </StatCard>

        <StatCard
          color="#007bff"
          clickable
          onClick={() => navigate("/workflows")}
        >
          <StatHeader>
            <StatIcon color="#007bff">
              <CheckCircle size={24} />
            </StatIcon>
            <StatTitle>Running Workflows</StatTitle>
          </StatHeader>
          <StatValue color="#007bff">
            {directDashboardData?.workflow_runs?.length || 0}
          </StatValue>
          <StatSubtext>
            <span>Currently executing</span>
            <ClickableHint color="#007bff">
              View workflows{" "}
              <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </ClickableHint>
          </StatSubtext>
        </StatCard>

        <StatCard
          color={
            apiHealth.healthy === apiHealth.total && apiHealth.total > 0
              ? "#28a745"
              : "#dc3545"
          }
          clickable
          onClick={() => navigate("/api/service-info")}
        >
          <StatHeader>
            <StatIcon
              color={
                apiHealth.healthy === apiHealth.total && apiHealth.total > 0
                  ? "#28a745"
                  : "#dc3545"
              }
            >
              <Server size={24} />
            </StatIcon>
            <StatTitle>TES Instance Health</StatTitle>
          </StatHeader>
          <StatValue
            color={
              apiHealth.healthy === apiHealth.total && apiHealth.total > 0
                ? "#28a745"
                : "#dc3545"
            }
          >
            {apiHealth.loading ? (
              <LoadingSpinner size="small" />
            ) : (
              `${apiHealth.healthy}/${apiHealth.total}`
            )}
          </StatValue>
          <StatSubtext>
            <span>Healthy Instances</span>
            <ClickableHint
              color={
                apiHealth.healthy === apiHealth.total && apiHealth.total > 0
                  ? "#28a745"
                  : "#dc3545"
              }
            >
              TES Network <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </ClickableHint>
          </StatSubtext>
          {apiHealth.healthy < apiHealth.total &&
            apiHealth.total > 0 &&
            !apiHealth.loading && (
              <div
                style={{
                  color: "#dc3545",
                  fontSize: 13,
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <AlertTriangle size={16} style={{ marginRight: 6 }} />
                Not all TES instances are available
              </div>
            )}
        </StatCard>

        <StatCard
          color={
            apiTestSummary.passing === apiTestSummary.total &&
            apiTestSummary.total > 0
              ? "#28a745"
              : "#dc3545"
          }
          clickable
          onClick={() => navigate("/utilities")}
        >
          <StatHeader>
            <StatIcon
              color={
                apiTestSummary.passing === apiTestSummary.total &&
                apiTestSummary.total > 0
                  ? "#28a745"
                  : "#dc3545"
              }
            >
              <Activity size={24} />
            </StatIcon>
            <StatTitle>System Health</StatTitle>
          </StatHeader>
          <StatValue
            color={
              apiTestSummary.passing === apiTestSummary.total &&
              apiTestSummary.total > 0
                ? "#28a745"
                : "#dc3545"
            }
          >
            {apiTestSummary.loading ? (
              <LoadingSpinner size="small" />
            ) : (
              `${apiTestSummary.passing}/${apiTestSummary.total}`
            )}
          </StatValue>
          <StatSubtext>
            <span>API Tests Pass</span>
            <ClickableHint
              color={
                apiTestSummary.passing === apiTestSummary.total &&
                apiTestSummary.total > 0
                  ? "#28a745"
                  : "#dc3545"
              }
            >
              Diagnostics <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </ClickableHint>
          </StatSubtext>
          {apiTestSummary.passing < apiTestSummary.total &&
            apiTestSummary.total > 0 &&
            !apiTestSummary.loading && (
              <div
                style={{
                  color: "#dc3545",
                  fontSize: 13,
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <AlertTriangle size={16} style={{ marginRight: 6 }} />
                Some API tests are failing
              </div>
            )}
          {apiTestSummary.error && (
            <div
              style={{
                color: "#dc3545",
                fontSize: 13,
                marginTop: 8,
                display: "flex",
                alignItems: "center",
              }}
            >
              <AlertTriangle size={16} style={{ marginRight: 6 }} />
              {apiTestSummary.error}
            </div>
          )}
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <ContentCard>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <RefreshButton
              onClick={handleRefresh}
              disabled={tasksLoading || dashboardLoading}
            >
              <RefreshCw size={16} />
              Refresh
            </RefreshButton>
          </CardHeader>
          {tasksLoading && <LoadingSpinner text="Loading tasks..." />}
          {tasksError && <ErrorMessage message={tasksError} />}
          {!tasksLoading && !tasksError && tasksArray.length > 0 && (
            <TasksList>
              {tasksArray.slice(0, 5).map((task, index) => (
                <TaskItem
                  key={task.id || index}
                  onClick={() => navigate(`/task-details?id=${task.id}`)}
                >
                  <TaskInfo>
                    <TaskId>{task.id || `Task ${index + 1}`}</TaskId>
                    <TaskMeta>
                      Created: {formatDate(task.creation_time)} | TES:{" "}
                      {task.tes_url || "Unknown"}
                    </TaskMeta>
                  </TaskInfo>
                  <TaskStatus status={task.state}>
                    {formatTaskStatus(task.state)}
                  </TaskStatus>
                </TaskItem>
              ))}
            </TasksList>
          )}
          {!tasksLoading && !tasksError && tasksArray.length === 0 && (
            <EmptyState>
              No tasks found. Submit a task to get started!
            </EmptyState>
          )}
        </ContentCard>

        <ContentCard>
          <CardHeader>
            <CardTitle>Recent Workflows</CardTitle>
            <RefreshButton
              onClick={handleRefresh}
              disabled={workflowsLoading || dashboardLoading}
            >
              <RefreshCw size={16} />
              Refresh
            </RefreshButton>
          </CardHeader>
          {workflowsLoading && <LoadingSpinner text="Loading workflows..." />}
          {workflowsError && <ErrorMessage message={workflowsError} />}
          {!workflowsLoading &&
            !workflowsError &&
            workflowsData &&
            workflowsData.length > 0 && (
              <WorkflowsList>
                {workflowsData.slice(0, 5).map((workflow, index) => (
                  <WorkflowItem
                    key={workflow.run_id || index}
                    onClick={() =>
                      navigate(`/workflows/details/${workflow.run_id}`)
                    }
                  >
                    <WorkflowInfo>
                      <WorkflowId>
                        {workflow.run_id || `Workflow ${index + 1}`}
                      </WorkflowId>
                      <WorkflowMeta>
                        Type: {workflow.type || "Unknown"} | TES:{" "}
                        {workflow.tes_url || "Unknown"}
                      </WorkflowMeta>
                    </WorkflowInfo>
                    <WorkflowStatus
                      status={
                        workflow.status === "COMPLETE" &&
                        (!workflow.steps || workflow.steps.length === 0)
                          ? "FAILED"
                          : workflow.status
                      }
                    >
                      {workflow.status === "COMPLETE" &&
                      (!workflow.steps || workflow.steps.length === 0)
                        ? "FAILED"
                        : workflow.status || "UNKNOWN"}
                    </WorkflowStatus>
                  </WorkflowItem>
                ))}
              </WorkflowsList>
            )}
          {!workflowsLoading &&
            !workflowsError &&
            (!workflowsData || workflowsData.length === 0) && (
              <EmptyState>
                No workflows found. Submit a workflow to get started!
              </EmptyState>
            )}
        </ContentCard>
      </ContentGrid>
    </DashboardContainer>
  );
};

export default Dashboard;
