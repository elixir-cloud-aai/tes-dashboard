import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { workflowService } from "../services/workflowService";
import { testConnection } from "../services/api";
import useInstances from "../hooks/useInstances";
import ErrorMessage from "../components/common/ErrorMessage";
import {
  ArrowLeft,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
} from "lucide-react";

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

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  margin: 0 0 30px 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
`;

const HelpText = styled.small`
  color: #6c757d;
  font-size: 12px;
  margin-top: 6px;
  display: block;
  line-height: 1.4;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 30px;
`;

const ButtonIcon = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  background: ${(props) =>
    props.variant === "primary"
      ? "#3182ce"
      : props.variant === "demo"
        ? "#10b981"
        : "#64748b"};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  &:hover:not(:disabled) {
    background: ${(props) =>
      props.variant === "primary"
        ? "#2c5282"
        : props.variant === "demo"
          ? "#059669"
          : "#475569"};
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusNotification = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ConnectionTestAlert = styled.div`
  background: ${(props) => (props.success ? "#d4edda" : "#f8d7da")};
  border: 2px solid ${(props) => (props.success ? "#c3e6cb" : "#f5c6cb")};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  color: ${(props) => (props.success ? "#155724" : "#721c24")};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const AlertContent = styled.div`
  flex: 1;

  strong {
    display: block;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  p {
    margin: 0;
    opacity: 0.95;
    line-height: 1.5;
  }
`;

const DemoButtonGroup = styled.div`
  background: #f4f6fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #e2e8f0;
`;

const DemoTitle = styled.h3`
  margin: 0 0 10px 0;
  color: black;
  font-size: 18px;
  font-weight: 600;
`;

const DemoDescription = styled.p`
  margin: 0 0 15px 0;
  color: rgba(0, 0, 0, 0.9);
  font-size: 14px;
  line-height: 1.5;
`;

const WorkflowCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid ${(props) => (props.selected ? "#3182ce" : "#e2e8f0")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3182ce;
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.15);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const WorkflowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const WorkflowTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WorkflowBadge = styled.span`
  background: ${(props) => props.color || "#667eea"};
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const WorkflowDescription = styled.p`
  margin: 0;
  font-size: 13px;
  color: #718096;
  line-height: 1.4;
`;

const WorkflowDetails = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #4a5568;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

// Pre-baked workflow examples with complete configurations
const WORKFLOW_EXAMPLES = {
  snakemake_hello: {
    type: "snakemake",
    name: "Hello World (Snakemake)",
    description:
      "Simple two-step pipeline that demonstrates basic Snakemake workflow execution",
    snakefile: `# Simple Hello World Snakemake Workflow
rule all:
    input:
        "output/final.txt"

rule step1:
    output:
        "output/step1.txt"
    shell:
        """
        mkdir -p output
        echo 'Hello from Step 1' > {output}
        date >> {output}
        """

rule step2:
    input:
        "output/step1.txt"
    output:
        "output/final.txt"
    shell:
        """
        echo 'Step 2: Processing...' > {output}
        cat {input} >> {output}
        echo 'Workflow completed successfully!' >> {output}
        """`,
    inputs: [],
    outputs: ["output/final.txt"],
    resources: {
      cpu: 1,
      ram: 2,
      disk: 5,
    },
  },
  snakemake_data: {
    type: "snakemake",
    name: "Data Processing (Snakemake)",
    description: "Multi-step pipeline with file downloads and data processing",
    snakefile: `# Data Processing Snakemake Workflow
rule all:
    input:
        "results/summary.txt"

rule download:
    output:
        "data/input.txt"
    shell:
        """
        mkdir -p data
        curl -L https://raw.githubusercontent.com/ga4gh/task-execution-schemas/develop/README.md > {output}
        """

rule process:
    input:
        "data/input.txt"
    output:
        "results/processed.txt"
    shell:
        """
        mkdir -p results
        wc -l {input} > {output}
        wc -w {input} >> {output}
        echo 'Processing complete' >> {output}
        """

rule summarize:
    input:
        "results/processed.txt"
    output:
        "results/summary.txt"
    shell:
        """
        echo '=== Workflow Summary ===' > {output}
        cat {input} >> {output}
        date >> {output}
        """`,
    inputs: [],
    outputs: ["results/summary.txt"],
    resources: {
      cpu: 1,
      ram: 2,
      disk: 10,
    },
  },
  nextflow_hello: {
    type: "nextflow",
    name: "Hello World (Nextflow)",
    description: "Basic Nextflow pipeline demonstrating channel-based workflow",
    workflow_file: `#!/usr/bin/env nextflow

// Simple Hello World Nextflow Pipeline

params.greeting = 'Hello World from Nextflow!'

process sayHello {
    output:
    path 'hello.txt'

    script:
    """
    echo "\${params.greeting}" > hello.txt
    date >> hello.txt
    """
}

process processGreeting {
    input:
    path greeting_file

    output:
    path 'result.txt'

    script:
    """
    echo "Processing greeting..." > result.txt
    cat \${greeting_file} >> result.txt
    echo "Pipeline completed!" >> result.txt
    """
}

workflow {
    sayHello() | processGreeting | view
}`,
    inputs: [],
    outputs: ["result.txt"],
    resources: {
      cpu: 1,
      ram: 2,
      disk: 5,
    },
  },
};

const SubmitWorkflow = () => {
  const navigate = useNavigate();
  const {
    instances,
    allInstances,
    loading: instancesLoading,
    refresh: refreshInstances,
  } = useInstances();
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [workflowFileContent, setWorkflowFileContent] = useState("");
  const [isGateway, setIsGateway] = useState(false);

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    return status === "healthy" ? "✅" : "❌";
  };

  // On mount, select a random healthy instance if available
  useEffect(() => {
    const healthyInstances = (
      allInstances.length > 0 ? allInstances : instances
    ).filter((inst) => String(inst.status).toLowerCase() === "healthy");
    if (healthyInstances.length > 0 && !selectedInstance) {
      setSelectedInstance(healthyInstances[0].url);
    }
    // eslint-disable-next-line
  }, [allInstances, instances]);

  // When workflow changes, update the editable file content
  useEffect(() => {
    if (selectedWorkflow) {
      const wf = WORKFLOW_EXAMPLES[selectedWorkflow];
      setWorkflowFileContent(wf?.snakefile || wf?.workflow_file || "");
    } else {
      setWorkflowFileContent("");
    }
  }, [selectedWorkflow]);

  const handleWorkflowSelect = (workflowKey) => {
    setSelectedWorkflow(workflowKey);
    setError("");
  };

  const handleChange = (e) => {
    const url = e.target.value;
    setSelectedInstance(url);

    // Check if the selected instance is a gateway (e.g., proTES)
    // In a real implementation, this would be based on instance metadata
    const inst =
      allInstances.find((i) => i.url === url) ||
      instances.find((i) => i.url === url);
    const name = inst?.name?.toLowerCase() || "";
    setIsGateway(name.includes("protes") || name.includes("gateway"));
  };

  const handleTestConnection = async () => {
    if (!selectedInstance) {
      setError("Please select an instance to test");
      return;
    }
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      // In a real scenario, we would test the specific selectedInstance
      const result =
        await workflowService.testInstanceConnection(selectedInstance);
      setConnectionTestResult({
        success: true,
        message:
          result.message || `Connection to ${selectedInstance} successful`,
      });
    } catch (err) {
      setConnectionTestResult({
        success: false,
        message:
          err.message ||
          `Connection to ${selectedInstance} failed. Check URL and health status.`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedInstance) {
      setError("Please select a TES instance");
      return;
    }
    if (!selectedWorkflow) {
      setError("Please select a workflow example");
      return;
    }
    const workflow = WORKFLOW_EXAMPLES[selectedWorkflow];
    if (!workflow) {
      setError("Invalid workflow selection");
      return;
    }
    setLoading(true);
    try {
      const workflowContent = workflowFileContent;
      const fileName =
        workflow.type === "snakemake"
          ? "Snakefile"
          : workflow.type === "nextflow"
            ? "main.nf"
            : "workflow.cwl";
      const workflowBlob = new Blob([workflowContent], { type: "text/plain" });
      const workflowFile = new File([workflowBlob], fileName, {
        type: "text/plain",
      });
      const workflowData = {
        wf_type: workflow.type,
        wf_tes_instance: selectedInstance,
        wf_distribution_logic: "round-robin",
        snakefile: workflowFile,
        workflow_name: workflow.name,
        workflow_description: workflow.description,
      };
      await workflowService.submitWorkflow(workflowData);
      navigate("/workflows");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit workflow",
      );
    } finally {
      setLoading(false);
    }
  };

  // Button group for workflow examples (like demo tasks)
  const handleWorkflowButton = (workflowKey) => {
    setSelectedWorkflow(workflowKey);
    setError("");
    // Pick a random healthy instance for workflow
    const healthyInstances = (
      allInstances.length > 0 ? allInstances : instances
    ).filter((inst) => String(inst.status).toLowerCase() === "healthy");
    if (healthyInstances.length > 0) {
      const random =
        healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
      setSelectedInstance(random.url);
    }
  };

  return (
    <PageContainer>
      <BackButton onClick={() => navigate("/workflows")}>
        <ArrowLeft size={18} style={{ marginRight: 8 }} />
        Back to Workflows
      </BackButton>
      <FormCard>
        <Title>Submit Workflow</Title>

        {/* Removed misleading 'No healthy TES instances found' UI message. Now only logs to console for debugging. */}
        {instances.length === 0 &&
          !instancesLoading &&
          (() => {
            console.log(
              "No TES instances found (allInstances and instances are empty).",
            );
            return null;
          })()}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="tes_instance">Target TES Instance *</Label>
            <Select
              id="tes_instance"
              name="tes_instance"
              value={selectedInstance}
              onChange={handleChange}
              disabled={instancesLoading}
              required
            >
              <option value="">Select TES Instance</option>
              {/* Only show healthy instances at the top, then others, but force tesk-prod.cloud.e-infra.cz as red cross */}
              {(() => {
                const all = allInstances.length > 0 ? allInstances : instances;
                // Move healthy to top, but tesk-prod.cloud.e-infra.cz always in 'others' and always red cross
                const isProdCZ = (inst) =>
                  inst.url && inst.url.includes("tesk-prod.cloud.e-infra.cz");
                const healthy = all.filter(
                  (inst) =>
                    String(inst.status).toLowerCase() === "healthy" &&
                    !isProdCZ(inst),
                );
                const prodCZ = all.filter(isProdCZ);
                const others = all.filter(
                  (inst) =>
                    String(inst.status).toLowerCase() !== "healthy" &&
                    !isProdCZ(inst),
                );
                return [...healthy, ...prodCZ, ...others].map(
                  (instance, index) => {
                    const name = instance.name || "Unknown Instance";
                    const isGatewayOption =
                      name.toLowerCase().includes("protes") ||
                      name.toLowerCase().includes("gateway");
                    const statusStr = String(instance.status).toLowerCase();
                    const isHealthy =
                      statusStr === "healthy" && !isProdCZ(instance);
                    const isProd = isProdCZ(instance);
                    const isUnauthorized =
                      statusStr.includes("auth required") ||
                      statusStr.includes("unauthorized") ||
                      instance.http_status === 401;
                    return (
                      <option key={index} value={instance.url}>
                        {isProd
                          ? "❌"
                          : isHealthy
                            ? "✅"
                            : isUnauthorized
                              ? "❌ (Unauthorized)"
                              : "❌"}{" "}
                        {instance.name} {isGatewayOption ? "(Gateway)" : ""}
                      </option>
                    );
                  },
                );
              })()}
            </Select>
            <HelpText>
              <strong>Workflow Routing:</strong>{" "}
              {isGateway
                ? "You have selected a Gateway. This instance will distribute your workflow tasks across multiple backend TES nodes based on its internal configuration."
                : "You have selected a direct TES instance. All tasks in this workflow will be executed on this specific node."}
            </HelpText>
            <HelpText style={{ marginTop: "8px" }}>
              <strong>Note:</strong> Only TES instances with a green check are
              healthy.
            </HelpText>
          </FormGroup>

          <DemoButtonGroup>
            <DemoTitle>Pre-configured Workflow Examples</DemoTitle>
            <DemoDescription>
              Click a button to auto-select a ready-to-run workflow example.
              These include complete workflow definitions, inputs, and outputs.
            </DemoDescription>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {Object.entries(WORKFLOW_EXAMPLES).map(([key, workflow]) => (
                <Button
                  key={key}
                  type="button"
                  variant="demo"
                  style={{
                    border:
                      selectedWorkflow === key
                        ? "2px solid #3182ce"
                        : undefined,
                  }}
                  onClick={() => handleWorkflowButton(key)}
                >
                  <Zap size={16} style={{ marginRight: "8px" }} />
                  {workflow.name}
                </Button>
              ))}
            </div>
          </DemoButtonGroup>

          {/* Show workflow details and editable file when selected */}
          {selectedWorkflow && (
            <WorkflowDetailsCard>
              <h4 style={{ margin: 0 }}>
                {WORKFLOW_EXAMPLES[selectedWorkflow].name}
              </h4>
              <p style={{ color: "#555", margin: "8px 0 16px 0" }}>
                {WORKFLOW_EXAMPLES[selectedWorkflow].description}
              </p>
              <Label htmlFor="workflow_file_content">Workflow File</Label>
              <textarea
                id="workflow_file_content"
                value={workflowFileContent}
                onChange={(e) => setWorkflowFileContent(e.target.value)}
                rows={10}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  padding: 10,
                  background: "#f8f9fa",
                }}
              />
            </WorkflowDetailsCard>
          )}

          {!selectedWorkflow && (
            <div
              style={{
                padding: "16px",
                background: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "8px",
                marginBottom: "20px",
                color: "#856404",
                fontSize: "14px",
              }}
            >
              ℹ️ Please select a workflow example above to continue
            </div>
          )}
          {error && <ErrorMessage message={error} />}
          {success && (
            <div style={{ color: "#10b981", marginBottom: 10 }}>{success}</div>
          )}

          {connectionTestResult && (
            <ConnectionTestAlert success={connectionTestResult.success}>
              {connectionTestResult.success ? (
                <CheckCircle size={24} />
              ) : (
                <XCircle size={24} />
              )}
              <AlertContent>
                <strong>
                  {connectionTestResult.success
                    ? "✓ Connection Test Passed"
                    : "✗ Connection Test Failed"}
                </strong>
                <p>{connectionTestResult.message}</p>
              </AlertContent>
            </ConnectionTestAlert>
          )}

          <ButtonGroup>
            <Button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || !selectedInstance}
            >
              {testingConnection ? (
                "Testing..."
              ) : (
                <>
                  <ButtonIcon>
                    <RefreshCw size={16} />
                  </ButtonIcon>
                  Test Connection
                </>
              )}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || instancesLoading}
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <ButtonIcon>
                    <Play size={16} />
                  </ButtonIcon>
                  Submit Workflow
                </>
              )}
            </Button>
            <Button type="button" onClick={() => navigate("/workflows")}>
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </FormCard>
    </PageContainer>
  );
};

export default SubmitWorkflow;

// Add missing WorkflowDetailsCard styled component
const WorkflowDetailsCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 24px;
`;
