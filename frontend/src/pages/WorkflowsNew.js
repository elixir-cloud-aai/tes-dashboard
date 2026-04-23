import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Play,
  RefreshCw,
  Eye,
  FileText,
  Code,
  Activity,
  MapPin,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import { workflowService } from "../services/workflowService";
import { formatDateTime } from "../utils/formatters";
import useInstances from "../hooks/useInstances";

const WorkflowsContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #222b45;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #4b5563;
  font-size: 1rem;
`;

const WorkflowSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #222b45;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #1e40af;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  display: block;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const CodePreview = styled.div`
  background: #1e293b;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
`;

const CodeContent = styled.pre`
  color: #e2e8f0;
  font-family: "Monaco", "Menlo", "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Button = styled.button`
  background: ${(props) =>
    props.variant === "primary" ? "#2563eb" : "#6b7280"};
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.variant === "primary" ? "#1d4ed8" : "#4b5563"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f9fafb;
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(props) => {
    switch (props.status?.toLowerCase()) {
      case "running":
        return "#dbeafe";
      case "completed":
        return "#d1fae5";
      case "failed":
        return "#fee2e2";
      default:
        return "#e5e7eb";
    }
  }};
  color: ${(props) => {
    switch (props.status?.toLowerCase()) {
      case "running":
        return "#1e40af";
      case "completed":
        return "#065f46";
      case "failed":
        return "#991b1b";
      default:
        return "#374151";
    }
  }};
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid #d1d5db;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #374151;
  margin-right: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

// Baked-in Snakemake example workflow
const EXAMPLE_SNAKEFILE = `# Distributed Snakemake Workflow Example
# This workflow demonstrates execution across multiple TES instances

rule all:
    input:
        "results/summary.txt"

rule step1_data_preparation:
    output:
        "results/step1_data.txt"
    shell:
        """
        echo "Step 1: Preparing data on TES instance..." > {output}
        echo "Timestamp: $(date)" >> {output}
        echo "Hostname: $(hostname)" >> {output}
        sleep 5
        """

rule step2_processing:
    input:
        "results/step1_data.txt"
    output:
        "results/step2_processed.txt"
    shell:
        """
        echo "Step 2: Processing data on TES instance..." > {output}
        cat {input} >> {output}
        echo "Processing completed: $(date)" >> {output}
        sleep 5
        """

rule step3_analysis:
    input:
        "results/step2_processed.txt"
    output:
        "results/step3_analysis.txt"
    shell:
        """
        echo "Step 3: Analyzing results on TES instance..." > {output}
        cat {input} >> {output}
        echo "Analysis completed: $(date)" >> {output}
        sleep 5
        """

rule step4_summary:
    input:
        "results/step3_analysis.txt"
    output:
        "results/summary.txt"
    shell:
        """
        echo "=== Workflow Summary ===" > {output}
        cat {input} >> {output}
        echo "Workflow completed successfully: $(date)" >> {output}
        """`;

const Workflows = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [success, setSuccess] = useState("");
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [selectedInstances, setSelectedInstances] = useState("all");

  const { instances, loading: instancesLoading } = useInstances();

  useEffect(() => {
    loadWorkflowRuns();
  }, []);

  const loadWorkflowRuns = async () => {
    try {
      setRunsLoading(true);
      const runs = await workflowService.getWorkflowRuns();
      setWorkflowRuns(runs || []);
    } catch (err) {
      console.error("Error loading workflow runs:", err);
      setWorkflowRuns([]);
    } finally {
      setRunsLoading(false);
    }
  };

  const handleSubmitWorkflow = async (e) => {
    e.preventDefault();

    if (selectedInstances === "all" && instances.length < 2) {
      setError(
        "Need at least 2 healthy TES instances for distributed execution. Please check instance status.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setErrorDetails("");

      // Create a Blob from the example Snakefile
      const snakefileBlob = new Blob([EXAMPLE_SNAKEFILE], {
        type: "text/plain",
      });
      const snakefileFile = new File([snakefileBlob], "Snakefile", {
        type: "text/plain",
      });

      const workflowData = {
        wf_type: "snakemake",
        wf_tes_instance: selectedInstances,
        wf_distribution_logic: "round-robin",
        snakefile: snakefileFile,
      };

      await workflowService.submitWorkflow(workflowData);

      alert(
        "Workflow submitted successfully! View execution on Network Topology.",
      );
      loadWorkflowRuns();

      // Navigate to topology after a brief delay
      setTimeout(() => {
        navigate("/topology");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit workflow",
      );
      console.error("Workflow submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLogs = (runId) => {
    navigate(`/logs?type=workflow&runId=${runId}`);
  };

  const handleViewOnMap = (runId) => {
    navigate(`/topology?workflow=${runId}`);
  };

  return (
    <WorkflowsContainer>
      <Header>
        <Title>Workflow Execution</Title>
        <Subtitle>
          Execute distributed Snakemake workflows across multiple TES instances
        </Subtitle>
      </Header>

      {/* Submit Workflow Section */}
      <WorkflowSection>
        <SectionTitle>
          <Play size={20} />
          Execute Example Workflow
        </SectionTitle>

        <InfoBox>
          <strong>📊 Distributed Execution:</strong> This example workflow
          contains 4 steps that will be distributed across your available TES
          instances. Watch the real-time execution on the Network Topology page!
        </InfoBox>

        <form onSubmit={handleSubmitWorkflow}>
          <FormGroup>
            <Label>Target TES Instances</Label>
            <Select
              value={selectedInstances}
              onChange={(e) => setSelectedInstances(e.target.value)}
              disabled={instancesLoading}
            >
              <option value="all">
                All Healthy Instances ({instances.length} available)
              </option>
              {instances.map((instance, idx) => (
                <option key={idx} value={instance.url}>
                  {instance.name} - {instance.url}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>
              <Code
                size={16}
                style={{ display: "inline", marginRight: "0.5rem" }}
              />
              Workflow Preview (Snakefile)
            </Label>
            <CodePreview>
              <CodeContent>{EXAMPLE_SNAKEFILE}</CodeContent>
            </CodePreview>
          </FormGroup>

          {error && <ErrorMessage message={error} />}

          <ButtonGroup>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || instancesLoading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size={16} />
                  Submitting...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Execute Workflow
                </>
              )}
            </Button>

            <Button type="button" onClick={() => navigate("/topology")}>
              <MapPin size={16} />
              View Network Topology
            </Button>
          </ButtonGroup>
        </form>
      </WorkflowSection>

      {/* Workflow Runs Section */}
      <WorkflowSection>
        <SectionTitle>
          <Activity size={20} />
          Workflow Execution History
          <Button
            style={{ marginLeft: "auto", padding: "0.5rem 1rem" }}
            onClick={loadWorkflowRuns}
            disabled={runsLoading}
          >
            <RefreshCw size={14} />
          </Button>
        </SectionTitle>

        {runsLoading ? (
          <LoadingSpinner text="Loading workflow runs..." />
        ) : workflowRuns.length === 0 ? (
          <EmptyState>
            No workflow executions yet. Submit your first workflow above!
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHeader>Run ID</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>TES Instance</TableHeader>
                <TableHeader>Submitted</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {workflowRuns.map((run, index) => (
                <TableRow key={run.run_id || index}>
                  <TableCell>
                    <code
                      style={{
                        fontSize: "0.75rem",
                        background: "#f3f4f6",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      {run.run_id?.substring(0, 8) || "N/A"}
                    </code>
                  </TableCell>
                  <TableCell>Snakemake</TableCell>
                  <TableCell>
                    <StatusBadge status={run.status}>
                      {run.status || "Unknown"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{run.tes_name || "Multiple"}</TableCell>
                  <TableCell>{formatDateTime(run.submitted_at)}</TableCell>
                  <TableCell>
                    {run.run_id && (
                      <>
                        <ActionButton
                          onClick={() => handleViewLogs(run.run_id)}
                        >
                          <FileText size={12} />
                          Logs
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleViewOnMap(run.run_id)}
                        >
                          <Eye size={12} />
                          View on Map
                        </ActionButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </WorkflowSection>
    </WorkflowsContainer>
  );
};

export default Workflows;
