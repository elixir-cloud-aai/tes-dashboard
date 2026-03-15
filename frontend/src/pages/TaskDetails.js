import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { taskService } from "../services/taskService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import { formatDate, formatTaskStatus } from "../utils/formatters";
import { TASK_STATE_COLORS } from "../utils/constants";
import { ArrowLeft, RefreshCw, StopCircle, Info } from "lucide-react";

const PageContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 80px);
`;

const BackButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-bottom: 20px;

  &:hover {
    background: #5a6268;
  }
`;

const PageHeader = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h1`
  margin: 0 0 10px 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
`;

const TaskId = styled.code`
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #495057;
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

const CardTitle = styled.h2`
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
  font-weight: 600;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f8f9fa;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #495057;
  font-size: 14px;
`;

const InfoValue = styled.span`
  color: #333;
  font-size: 14px;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
`;

const TaskStatus = styled.span`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background-color: ${(props) => TASK_STATE_COLORS[props.status] || "#6c757d"};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const ActionButton = styled.button`
  background: ${(props) =>
    props.variant === "danger" ? "#dc3545" : "#007bff"};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LogsSection = styled.div`
  grid-column: 1 / -1;
`;

const JsonContainer = styled.pre`
  background: #282c34;
  color: #abb2bf;
  border-radius: 8px;
  padding: 16px;
  font-size: 11px;
  line-height: 1.4;
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: ${(props) => props.color || "#6c757d"};
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 5px;
  margin-bottom: 5px;
`;

const ViewLevelDropdownContainer = styled.div`
  position: absolute;
  top: 24px;
  right: 32px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Dropdown = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  outline: none;
  cursor: pointer;
`;

const Tooltip = styled.div`
  position: absolute;
  background: #222;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  z-index: 10;
  top: 36px;
  right: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: none;
`;

const TaskDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewLevel, setViewLevel] = useState("Basic");
  const [showTooltip, setShowTooltip] = useState(false);

  const tesUrl = searchParams.get("tes_url");
  const taskId = searchParams.get("task_id");

  const viewLevelInfo = {
    Minimal: "Show only essential task info (ID, status, timing)",
    Basic: "Show basic info, timing, and status",
    Full: "Show all available task details and JSON",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await taskService.getTaskDetails(tesUrl, taskId);
        setTaskDetails(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    if (tesUrl && taskId) {
      fetchData();
    }
  }, [tesUrl, taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTaskDetails(tesUrl, taskId);
      setTaskDetails(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await taskService.cancelTask(tesUrl, taskId);
      await fetchTaskDetails();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Loading task details..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <BackButton onClick={() => navigate("/tasks")}>
          <ArrowLeft size={16} style={{ marginRight: "8px" }} />
          Back to Tasks
        </BackButton>
        <ErrorMessage error={error} title="Failed to load task details" />
      </PageContainer>
    );
  }

  const taskJson = taskDetails?.task_json || taskDetails?.task || {};

  // Helper: get executors/logs from taskJson (TES 1.1/GA4GH style)
  const executors = Array.isArray(taskJson.executors)
    ? taskJson.executors
    : Array.isArray(taskJson.resources?.executors)
      ? taskJson.resources.executors
      : [];
  const logs = Array.isArray(taskJson.logs)
    ? taskJson.logs
    : Array.isArray(taskDetails.task?.logs)
      ? taskDetails.task.logs
      : [];
  const jsonKeyCount =
    taskJson && typeof taskJson === "object" ? Object.keys(taskJson).length : 0;

  return (
    <PageContainer>
      <BackButton onClick={() => navigate("/tasks")}>
        <ArrowLeft size={16} style={{ marginRight: "8px" }} />
        Back to Tasks
      </BackButton>
      <PageHeader style={{ position: "relative" }}>
        <Title>Comprehensive Task Details</Title>
        <TaskId>{taskId}</TaskId>
        <ViewLevelDropdownContainer>
          <Dropdown
            value={viewLevel}
            onChange={(e) => setViewLevel(e.target.value)}
            aria-label="View Level"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <option value="Minimal">Minimal</option>
            <option value="Basic">Basic</option>
            <option value="Full">Full</option>
          </Dropdown>
          <span style={{ position: "relative" }}>
            <Info
              size={16}
              color="#64748b"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && <Tooltip>{viewLevelInfo[viewLevel]}</Tooltip>}
          </span>
        </ViewLevelDropdownContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <ActionButtons>
            <ActionButton onClick={fetchTaskDetails}>
              <RefreshCw size={16} style={{ marginRight: "8px" }} />
              Refresh
            </ActionButton>
            {(taskDetails?.task_json?.state === "RUNNING" ||
              taskDetails?.task?.status === "RUNNING" ||
              taskDetails?.task?.status === "QUEUED") && (
              <ActionButton
                variant="danger"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                <StopCircle size={16} style={{ marginRight: "8px" }} />
                Cancel Task
              </ActionButton>
            )}
          </ActionButtons>
        </div>
      </PageHeader>
      {taskDetails && (
        <ContentGrid>
          {/* Basic Information */}
          <ContentCard>
            <CardTitle>Basic Information</CardTitle>
            <InfoRow>
              <InfoLabel>Task ID:</InfoLabel>
              <InfoValue>
                {taskJson.id ||
                  taskDetails.task?.task_id ||
                  taskDetails.task?.id ||
                  "N/A"}
              </InfoValue>
            </InfoRow>
            {viewLevel !== "Minimal" && (
              <>
                <InfoRow>
                  <InfoLabel>Name:</InfoLabel>
                  <InfoValue>
                    {taskJson.name ||
                      taskDetails.task?.task_name ||
                      taskDetails.task?.name ||
                      "Unnamed Task"}
                  </InfoValue>
                </InfoRow>
              </>
            )}
            <InfoRow>
              <InfoLabel>State/Status:</InfoLabel>
              <InfoValue>
                <TaskStatus
                  status={
                    taskJson.state ||
                    taskDetails.task?.status ||
                    taskDetails.task?.state
                  }
                >
                  {formatTaskStatus(
                    taskJson.state ||
                      taskDetails.task?.status ||
                      taskDetails.task?.state,
                  )}
                </TaskStatus>
                {taskDetails.comprehensive_metadata?.is_terminal_state && (
                  <Badge color="#28a745">Terminal</Badge>
                )}
                {taskDetails.comprehensive_metadata?.is_running && (
                  <Badge color="#17a2b8">Active</Badge>
                )}
                {taskDetails.comprehensive_metadata?.is_queued && (
                  <Badge color="#ffc107">Queued</Badge>
                )}
              </InfoValue>
            </InfoRow>
            {viewLevel !== "Minimal" && (
              <>
                <InfoRow>
                  <InfoLabel>TES Instance:</InfoLabel>
                  <InfoValue>
                    {taskDetails.instance_name ||
                      taskDetails.task?.tes_name ||
                      "Unknown"}
                  </InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>TES URL:</InfoLabel>
                  <InfoValue
                    style={{ fontSize: "12px", wordBreak: "break-all" }}
                  >
                    {tesUrl || "N/A"}
                  </InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Description:</InfoLabel>
                  <InfoValue>
                    {taskJson.description ||
                      taskDetails.task?.description ||
                      "No description"}
                  </InfoValue>
                </InfoRow>
              </>
            )}
          </ContentCard>
          {/* Timing Information (always shown) */}
          <ContentCard>
            <CardTitle>Timing Information</CardTitle>
            <InfoRow>
              <InfoLabel>Creation Time:</InfoLabel>
              <InfoValue>
                {formatDate(
                  taskJson.creation_time ||
                    taskDetails.task?.submitted_at ||
                    taskDetails.task?.creation_time,
                ) || "N/A"}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>End Time:</InfoLabel>
              <InfoValue>
                {(() => {
                  const endTimeRaw =
                    taskJson.end_time || taskDetails.task?.end_time;
                  const state = (
                    taskJson.state ||
                    taskDetails.task?.status ||
                    taskDetails.task?.state ||
                    ""
                  ).toUpperCase();
                  const completedStates = [
                    "COMPLETE",
                    "CANCELED",
                    "CANCELLED",
                    "EXECUTOR_ERROR",
                    "SYSTEM_ERROR",
                    "UNKNOWN",
                    "FAILED",
                    "ERROR",
                  ]; // add more as needed
                  if (
                    endTimeRaw &&
                    endTimeRaw !== null &&
                    endTimeRaw !== undefined &&
                    endTimeRaw !== ""
                  ) {
                    return formatDate(endTimeRaw);
                  } else if (completedStates.includes(state)) {
                    // fallback: show last fetched time as end time if task is completed but end_time is missing
                    return (
                      formatDate(taskDetails.fetch_timestamp) + " (inferred)"
                    );
                  } else {
                    return "N/A";
                  }
                })()}
              </InfoValue>
            </InfoRow>
            {taskDetails.comprehensive_metadata?.duration_seconds && (
              <InfoRow>
                <InfoLabel>Duration:</InfoLabel>
                <InfoValue>
                  {(() => {
                    const seconds =
                      taskDetails.comprehensive_metadata.duration_seconds;
                    const minutes = Math.floor(seconds / 60);
                    const hours = Math.floor(minutes / 60);
                    if (hours > 0)
                      return `${hours}h ${minutes % 60}m ${Math.floor(seconds % 60)}s`;
                    if (minutes > 0)
                      return `${minutes}m ${Math.floor(seconds % 60)}s`;
                    return `${Math.floor(seconds)}s`;
                  })()}
                </InfoValue>
              </InfoRow>
            )}
            <InfoRow>
              <InfoLabel>Last Fetched:</InfoLabel>
              <InfoValue>
                {formatDate(taskDetails.fetch_timestamp) || "N/A"}
              </InfoValue>
            </InfoRow>
          </ContentCard>
          {/* Full JSON view only in Full view */}
          {viewLevel === "Full" && (
            <>
              <LogsSection>
                <ContentCard>
                  <CardTitle>Complete Task JSON [{jsonKeyCount}]</CardTitle>
                  <div
                    style={{
                      marginBottom: "15px",
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge
                      color={
                        taskDetails.source === "tes_instance"
                          ? "#28a745"
                          : "#6f42c1"
                      }
                    >
                      {taskDetails.source === "tes_instance"
                        ? "TES Instance API"
                        : "Dashboard Submission"}
                    </Badge>
                    {taskDetails.tes_endpoint && (
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        Endpoint: {taskDetails.tes_endpoint}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      marginBottom: "15px",
                      padding: "12px",
                      background: "#f8f9fa",
                      borderLeft: "4px solid #17a2b8",
                      borderRadius: "4px",
                      fontSize: "13px",
                      color: "#495057",
                    }}
                  >
                    <strong>About "state" vs "status":</strong> The TES
                    specification uses{" "}
                    <code
                      style={{
                        background: "#e9ecef",
                        padding: "2px 6px",
                        borderRadius: "3px",
                      }}
                    >
                      state
                    </code>{" "}
                    as the official field name (e.g., QUEUED, RUNNING,
                    COMPLETE). Some TES implementations also include a{" "}
                    <code
                      style={{
                        background: "#e9ecef",
                        padding: "2px 6px",
                        borderRadius: "3px",
                      }}
                    >
                      status
                    </code>{" "}
                    field for compatibility. This dashboard handles both fields
                    to work with all TES implementations.
                  </div>
                  <JsonContainer>
                    {JSON.stringify(taskJson, null, 2)}
                  </JsonContainer>
                </ContentCard>
              </LogsSection>
              {/* Logs section below JSON */}
              <LogsSection>
                <ContentCard>
                  <CardTitle>Task Logs</CardTitle>
                  {Array.isArray(logs) && logs.length > 0 ? (
                    logs.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          Log #{idx + 1}
                        </div>
                        <JsonContainer>
                          {JSON.stringify(log, null, 2)}
                        </JsonContainer>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#888", fontSize: 14 }}>
                      No logs available for this task.
                    </div>
                  )}
                </ContentCard>
              </LogsSection>
            </>
          )}
        </ContentGrid>
      )}
    </PageContainer>
  );
};

export default TaskDetails;
