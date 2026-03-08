import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { workflowService } from "../services/workflowService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import { ArrowLeft, FileJson, Clock, Server, Activity } from "lucide-react";
import TopologyMap from "../components/TopologyMap";
import GeoTopologyMap from "../components/GeoTopologyMap";

const PageContainer = styled.div`
  padding: 24px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 64px);
  max-width: 1400px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    background: #f8fafc;
    color: #1e293b;
    border-color: #cbd5e1;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1e293b;
  font-weight: 700;
`;

const RunId = styled.code`
  font-size: 13px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  color: #64748b;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

const CardTitle = styled.h2`
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #1e293b;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
  text-align: right;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${(props) => {
    switch (props.status) {
      case "COMPLETE":
        return "#dcfce7";
      case "RUNNING":
        return "#dbeafe";
      case "SYSTEM_ERROR":
        return "#fee2e2";
      case "CANCELED":
        return "#f1f5f9";
      default:
        return "#fef3c7";
    }
  }};
  color: ${(props) => {
    switch (props.status) {
      case "COMPLETE":
        return "#166534";
      case "RUNNING":
        return "#1e40af";
      case "SYSTEM_ERROR":
        return "#991b1b";
      case "CANCELED":
        return "#475569";
      default:
        return "#92400e";
    }
  }};
`;

const JsonContainer = styled.pre`
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 500px;
  overflow: auto;
  font-family: "Fira Code", monospace;
`;

const MapSection = styled.div`
  margin-top: 24px;
`;

const formatStatus = (status) => {
  if (!status) return "UNKNOWN";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const WorkflowDetails = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkflow = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await workflowService.getWorkflowRun(runId);
        if (data) {
          setWorkflow(data);
        } else {
          setError("Workflow record not found.");
        }
      } catch (err) {
        setError("Failed to load workflow details.");
      } finally {
        setLoading(false);
      }
    };
    if (runId) fetchWorkflow();
  }, [runId]);

  if (loading)
    return (
      <PageContainer>
        <LoadingSpinner text="Fetching workflow context..." />
      </PageContainer>
    );
  if (error)
    return (
      <PageContainer>
        <ErrorMessage message={error} />
      </PageContainer>
    );
  if (!workflow)
    return (
      <PageContainer>
        <ErrorMessage message="No workflow found" />
      </PageContainer>
    );

  return (
    <PageContainer>
      <BackButton onClick={() => navigate("/workflows")}>
        <ArrowLeft size={16} style={{ marginRight: "8px" }} />
        Back to Workflows
      </BackButton>

      <Header>
        <TitleSection>
          <Title>Workflow Context</Title>
          <RunId>{workflow.run_id}</RunId>
        </TitleSection>
        <StatusBadge status={workflow.status}>
          {formatStatus(workflow.status)}
        </StatusBadge>
      </Header>

      <Grid>
        <ContentCard>
          <CardTitle>
            <Activity size={18} /> Basic Information
          </CardTitle>
          <InfoRow>
            <InfoLabel>Status</InfoLabel>
            <InfoValue>{formatStatus(workflow.status)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Execution Node</InfoLabel>
            <InfoValue>{workflow.tes_name || "Multi-node Fleet"}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Engine Type</InfoLabel>
            <InfoValue>{(workflow.type || "CWL").toUpperCase()}</InfoValue>
          </InfoRow>
        </ContentCard>

        <ContentCard>
          <CardTitle>
            <Clock size={18} /> Timing
          </CardTitle>
          <InfoRow>
            <InfoLabel>Submitted At</InfoLabel>
            <InfoValue>
              {workflow.submitted_at
                ? new Date(workflow.submitted_at).toLocaleString()
                : "N/A"}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Duration</InfoLabel>
            <InfoValue>Calculated at runtime</InfoValue>
          </InfoRow>
        </ContentCard>
      </Grid>

      <Grid>
        <ContentCard>
          <CardTitle>
            <Server size={18} /> Infrastructure Logic
          </CardTitle>
          <TopologyMap workflowId={workflow.run_id} />
        </ContentCard>

        <ContentCard>
          <CardTitle>
            <FileJson size={18} /> Complete Run JSON
          </CardTitle>
          <JsonContainer>{JSON.stringify(workflow, null, 2)}</JsonContainer>
        </ContentCard>
      </Grid>

      <MapSection>
        <ContentCard>
          <CardTitle>
            <Activity size={18} /> Geographical Distribution & Data Flow
          </CardTitle>
          <GeoTopologyMap workflowId={workflow.run_id} />
        </ContentCard>
      </MapSection>
    </PageContainer>
  );
};

export default WorkflowDetails;
