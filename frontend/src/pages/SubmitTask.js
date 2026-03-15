import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { testConnection } from "../services/api";
import { taskService } from "../services/taskService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import useInstances from "../hooks/useInstances";
import {
  ArrowLeft,
  Play,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
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

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
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

const DemoButtonGroup = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
`;

const DemoTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 16px;
  font-weight: 600;
`;

const DemoDescription = styled.p`
  margin: 0 0 15px 0;
  color: #6c757d;
  font-size: 14px;
  line-height: 1.5;
`;

const StatusNotification = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HelpText = styled.small`
  color: #6c757d;
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

const ConnectionTestBanner = styled.div`
  background: ${(props) => (props.success ? "#d4edda" : "#f8d7da")};
  border: 1px solid ${(props) => (props.success ? "#c3e6cb" : "#f5c6cb")};
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

const ConnectionTestMessage = styled.div`
  flex: 1;

  strong {
    display: block;
    margin-bottom: 4px;
    font-weight: 600;
  }

  small {
    opacity: 0.9;
  }
`;

const SubmitTask = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tes_instance: "",
    task_name: "",
    docker_image: "",
    command: "",
    input_url: "",
    output_url: "",
    cpu_cores: "1",
    ram_gb: "2",
    disk_gb: "10",
    description: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);

  const {
    instances,
    allInstances,
    loading: instancesLoading,
    error: instancesError,
    refresh: refreshInstances,
  } = useInstances();

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    return status === "healthy" ? "✅" : "❌";
  };

  const getRandomHealthyInstance = () => {
    const healthyInstances = (
      allInstances.length > 0 ? allInstances : instances
    ).filter((instance) => instance.status === "healthy");
    if (healthyInstances.length === 0) return "";
    const idx = Math.floor(Math.random() * healthyInstances.length);
    return healthyInstances[idx].url;
  };

  useEffect(() => {
    // On mount, select a random healthy instance if available
    const healthyInstances = (allInstances.length > 0 ? allInstances : instances).filter(
      (inst) => String(inst.status).toLowerCase() === 'healthy'
    );
    if (healthyInstances.length > 0 && !formData.tes_instance) {
      const random = healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
      setFormData((prev) => ({ ...prev, tes_instance: random.url }));
    }
    // eslint-disable-next-line
  }, [allInstances, instances]);

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionTestResult(null);

      const result = await testConnection();
      console.log("Connection test result:", result);

      setConnectionTestResult({
        success: true,
        message: result.message || "Backend connection successful",
        timestamp: result.timestamp || new Date().toISOString(),
      });
    } catch (err) {
      console.error("Connection test failed:", err);
      setConnectionTestResult({
        success: false,
        message: err.message || "Connection test failed",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getDemoTaskData = (demoType = "basic") => {
    // Use random healthy instance as default for demos
    let defaultTesInstance = getRandomHealthyInstance();

    const demoTasks = {
      basic: {
        tes_instance: defaultTesInstance,
        task_name: "Demo Hello World Task",
        docker_image: "alpine:latest",
        command: 'echo "Hello from TES!" && date && uname -a',
        input_url: "",
        output_url: "",
        cpu_cores: "1",
        ram_gb: "1",
        disk_gb: "1",
        description:
          "A simple demo task that prints system information. Uses Alpine Linux for fast execution.",
      },
      python: {
        tes_instance: defaultTesInstance,
        task_name: "Demo Python Script Task",
        docker_image: "python:3.11-alpine",
        command:
          'python3 -c "import sys; import datetime; print(sys.version); print(datetime.datetime.now())"',
        input_url: "",
        output_url: "",
        cpu_cores: "1",
        ram_gb: "1",
        disk_gb: "1",
        description:
          "A Python demo task using Alpine-based Python image for faster execution.",
      },
      fileops: {
        tes_instance: defaultTesInstance,
        task_name: "Demo File Operations Task",
        docker_image: "alpine:latest",
        command:
          "ls -lh /tmp/input && wc -c /tmp/input > /tmp/output && cat /tmp/output",
        input_url: "https://speed.hetzner.de/1MB.bin",
        output_url: "",
        cpu_cores: "1",
        ram_gb: "2",
        disk_gb: "5",
        description:
          "Demonstrates file input and output operations. Downloads a 1MB file to /tmp/input, counts bytes, writes result to /tmp/output, and displays it.",
      },
      multiExec: {
        tes_instance: getRandomHealthyInstance(),
        task_name: "Demo Multi-Executor Task",
        docker_image: "alpine:latest", // Set to first executor's image for form validation
        command: "echo 'Multi-executor task - see executors array'",
        input_url: "",
        output_url: "",
        cpu_cores: "1",
        ram_gb: "2",
        disk_gb: "5",
        description:
          "A demo task with multiple executors. Each executor runs sequentially with different commands and images.",
        executors: [
          {
            image: "alpine:latest",
            command: [
              "sh",
              "-c",
              "echo 'Executor 1: Hello from Alpine!' && date",
            ],
            workdir: "/tmp",
          },
          {
            image: "alpine:latest",
            command: [
              "sh",
              "-c",
              "echo 'Executor 2: Checking system' && uname -a",
            ],
            workdir: "/tmp",
          },
          {
            image: "alpine:latest",
            command: [
              "sh",
              "-c",
              "echo 'Executor 3: Task complete!' && whoami",
            ],
            workdir: "/tmp",
          },
        ],
      },
    };

    return demoTasks[demoType] || demoTasks.basic;
  };

  const handleRunDemo = (demoType = "basic") => {
    const demoData = getDemoTaskData(demoType);
    // Pick a random healthy instance for demo
    const healthyInstances = (allInstances.length > 0 ? allInstances : instances).filter(
      (inst) => String(inst.status).toLowerCase() === 'healthy'
    );
    if (healthyInstances.length > 0) {
      const random = healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
      demoData.tes_instance = random.url;
    }
    setFormData(demoData);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: TES instance and docker image required
    if (!formData.tes_instance) {
      setError(new Error("Please select a TES instance"));
      return;
    }

    // Multi-Executor validation: every executor must have an image and command
    if (formData.executors && Array.isArray(formData.executors)) {
      const invalidExecutor = formData.executors.find(
        (exec) =>
          !exec.image ||
          exec.image.trim() === "" ||
          !exec.command ||
          exec.command.length === 0,
      );
      if (invalidExecutor) {
        setError(
          new Error(
            "Each executor must have a Docker image and a command. Check your multi-executor configuration.",
          ),
        );
        return;
      }
    } else if (!formData.docker_image) {
      // Single executor needs docker_image
      setError(new Error("Docker image is required"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        tes_instance: formData.tes_instance,
        task_type: "custom",
        task_name: formData.task_name,
        docker_image: formData.docker_image,
        command: formData.command,
        input_url: formData.input_url,
        output_url: formData.output_url,
        cpu_cores: formData.cpu_cores,
        ram_gb: formData.ram_gb,
        disk_gb: formData.disk_gb,
        description: formData.description,
        ...(formData.executors ? { executors: formData.executors } : {}),
      };

      // Attach demoType for actionable error context
      let demoType = null;
      if (formData.task_name && formData.task_name.toLowerCase().includes('file')) demoType = 'fileops';
      if (formData.task_name && formData.task_name.toLowerCase().includes('multi')) demoType = 'multiExec';

      console.log("Submitting task with data:", submitData);

      const result = await taskService.submitTask(submitData);

      console.log("Task submission result:", result);

      navigate("/tasks");
    } catch (err) {
      console.error("Task submission error:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));

      if (err.response) {
        console.error("Error response status:", err.response.status);
        console.error("Error response data:", err.response.data);
        console.error("Error response headers:", err.response.headers);
      }

      let errorMessage = "Failed to submit task";
      let errorReason = "";
      let errorType = "unknown";
      let errorCode = "";
      let statusCode = "";
      let tesName = "";
      let tesUrl = "";
      let tesEndpoint = "";

      if (err.response && err.response.data) {
        const errorData = err.response.data;

        // Extract all error information
        errorMessage =
          errorData.error ||
          errorData.message ||
          errorData.detail ||
          errorMessage;
        errorReason = errorData.reason || "";
        errorType = errorData.error_type || errorType;
        errorCode = errorData.error_code || "";
        statusCode = err.response.status || "";
        tesName = errorData.tes_name || "";
        tesUrl = errorData.tes_url || "";
        tesEndpoint = errorData.tes_endpoint || "";

        // Log for debugging
        console.error("Parsed error details:", {
          errorMessage,
          errorReason,
          errorType,
          errorCode,
          statusCode,
          tesName,
          tesUrl,
          tesEndpoint,
        });
      } else if (err.message) {
        errorMessage = err.message;
        console.error("Using err.message:", errorMessage);
      }

      // Create detailed error object with all information
      const detailedError = new Error(errorMessage);
      detailedError.reason = errorReason;
      detailedError.errorType = errorType;
      detailedError.errorCode = errorCode;
      detailedError.statusCode = statusCode;
      detailedError.response = err.response;

      // Add TES instance info if available
      if (tesName || tesUrl) {
        detailedError.tesInstance = {
          name: tesName,
          url: tesUrl,
          endpoint: tesEndpoint,
        };
      }

      // Add demoType for actionable error context
      let demoType = null;
      if (formData.task_name && formData.task_name.toLowerCase().includes('file')) demoType = 'fileops';
      if (formData.task_name && formData.task_name.toLowerCase().includes('multi')) demoType = 'multiExec';
      if (demoType) err.demoType = demoType;
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (instancesLoading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Loading healthy TES instances..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton onClick={() => navigate("/tasks")}>
        <ArrowLeft size={16} style={{ marginRight: "8px" }} />
        Back to Tasks
      </BackButton>

      <FormCard>
        <Title>Submit New Task</Title>

        <DemoButtonGroup>
          <DemoTitle>🚀 Quick Start Demo Tasks</DemoTitle>
          <DemoDescription>
            New to TES? Try one of our demo tasks! These will auto-populate all
            fields with safe, working examples that complete quickly.
          </DemoDescription>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Button
              type="button"
              variant="demo"
              onClick={() => handleRunDemo("basic")}
            >
              <Zap size={16} style={{ marginRight: "8px" }} />
              Basic Hello World
            </Button>
            <Button
              type="button"
              variant="demo"
              onClick={() => handleRunDemo("python")}
            >
              <Zap size={16} style={{ marginRight: "8px" }} />
              Python Script
            </Button>
            <Button
              type="button"
              variant="demo"
              onClick={() => handleRunDemo("fileops")}
            >
              <Zap size={16} style={{ marginRight: "8px" }} />
              File Operations
            </Button>
            <Button
              type="button"
              variant="demo"
              onClick={() => handleRunDemo("multiExec")}
            >
              <Zap size={16} style={{ marginRight: "8px" }} />
              Multi-Executor Demo
            </Button>
          </div>
        </DemoButtonGroup>

        {error && (
          <>
            <ErrorMessage error={error} title="Task Submission Failed" />
            <div style={{marginTop:8, fontSize:'13px', color:'#6b7280', background:'#f3f4f6', borderRadius:4, padding:'8px 12px'}}>
              <strong>What is the difference between <code>state</code> and <code>status</code>?</strong><br/>
              <ul style={{margin:'6px 0 0 18px', padding:0}}>
                <li><b>status</b>: Health/reachability of a TES instance (e.g., healthy, unreachable, error). Used for instance selection.</li>
                <li><b>state</b>: Lifecycle state of a submitted TES task (e.g., QUEUED, RUNNING, COMPLETE, ERROR). Used for task progress.</li>
              </ul>
            </div>
            {error.demoType && (
              <div style={{marginTop:8, fontSize:'13px', color:'#b91c1c', background:'#fef2f2', borderRadius:4, padding:'8px 12px'}}>
                <strong>Demo Task Info:</strong> {error.demoType === 'fileops' ? 'File I/O demo tasks may fail if the TES instance does not support remote file access or has restricted permissions.' : error.demoType === 'multiExec' ? 'Multi-executor demo tasks require TES v1.1+ support. Some TES implementations do not support multiple executors.' : ''}
              </div>
            )}
          </>
        )}
        {instancesError && <ErrorMessage error={instancesError} />}

        {/* Removed misleading 'No healthy TES instances found' UI message. Now only logs to console for debugging. */}
        {instances.length === 0 && !instancesLoading && (
          (() => { console.log('No TES instances found (allInstances and instances are empty).'); return null; })()
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="tes_instance">TES Instance *</Label>
            <Select
              id="tes_instance"
              name="tes_instance"
              value={formData.tes_instance}
              onChange={handleChange}
              required
            >
              <option value="">Select TES Instance</option>
              {/* Only show healthy instances at the top, then others, but force tesk-prod.cloud.e-infra.cz as red cross */}
              {(() => {
                const all = allInstances.length > 0 ? allInstances : instances;
                // Move healthy to top, but tesk-prod.cloud.e-infra.cz always in 'others' and always red cross
                const isProdCZ = (inst) => inst.url && inst.url.includes("tesk-prod.cloud.e-infra.cz");
                const healthy = all.filter(
                  (inst) => String(inst.status).toLowerCase() === "healthy" && !isProdCZ(inst)
                );
                const prodCZ = all.filter(isProdCZ);
                const others = all.filter(
                  (inst) => String(inst.status).toLowerCase() !== "healthy" && !isProdCZ(inst)
                );
                return [
                  ...healthy,
                  ...prodCZ,
                  ...others
                ].map((instance, index) => {
                  const statusStr = String(instance.status).toLowerCase();
                  const isHealthy = statusStr === "healthy" && !isProdCZ(instance);
                  const isProd = isProdCZ(instance);
                  const isUnauthorized = statusStr.includes("auth required") || statusStr.includes("unauthorized") || instance.http_status === 401;
                  return (
                    <option key={index} value={instance.url}>
                      {isProd ? "❌" : isHealthy ? "✅" : isUnauthorized ? "❌ (Unauthorized)" : "❌"} {instance.name}
                    </option>
                  );
                });
              })()}
            </Select>
            <HelpText>
              <strong>Note:</strong> Only TES instances with a green check are healthy and can accept tasks. If none are available, check your instance configuration or network.
            </HelpText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="task_name">Task Name</Label>
            <Input
              id="task_name"
              name="task_name"
              type="text"
              value={formData.task_name}
              onChange={handleChange}
              placeholder="My awesome task"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="docker_image">Docker Image *</Label>
            <Input
              id="docker_image"
              name="docker_image"
              type="text"
              value={formData.docker_image}
              onChange={handleChange}
              placeholder="ubuntu:20.04"
              required
            />
            <HelpText>
              Docker image to run the task (e.g., ubuntu:20.04, python:3.9)
            </HelpText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="command">Command</Label>
            <TextArea
              id="command"
              name="command"
              value={formData.command}
              onChange={handleChange}
              placeholder="echo 'Hello World'"
            />
            <HelpText>Command to execute in the container</HelpText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="input_url">Input URL</Label>
            <Input
              id="input_url"
              name="input_url"
              type="url"
              value={formData.input_url}
              onChange={handleChange}
              placeholder="ftp://example.com/input.txt"
            />
            <HelpText>URL to input files (optional)</HelpText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="output_url">Output URL</Label>
            <Input
              id="output_url"
              name="output_url"
              type="url"
              value={formData.output_url}
              onChange={handleChange}
              placeholder="ftp://example.com/output/"
            />
            <HelpText>URL where outputs should be stored (optional)</HelpText>
          </FormGroup>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "15px",
            }}
          >
            <FormGroup>
              <Label htmlFor="cpu_cores">CPU Cores</Label>
              <Input
                id="cpu_cores"
                name="cpu_cores"
                type="number"
                min="1"
                max="32"
                value={formData.cpu_cores}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="ram_gb">RAM (GB)</Label>
              <Input
                id="ram_gb"
                name="ram_gb"
                type="number"
                min="1"
                max="128"
                value={formData.ram_gb}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="disk_gb">Disk (GB)</Label>
              <Input
                id="disk_gb"
                name="disk_gb"
                type="number"
                min="1"
                max="1000"
                value={formData.disk_gb}
                onChange={handleChange}
              />
            </FormGroup>
          </div>

          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Task description..."
            />
          </FormGroup>

          {connectionTestResult && (
            <ConnectionTestBanner success={connectionTestResult.success}>
              {connectionTestResult.success ? (
                <CheckCircle size={24} />
              ) : (
                <XCircle size={24} />
              )}
              <ConnectionTestMessage>
                <strong>
                  {connectionTestResult.success
                    ? "Connection Test Passed"
                    : "Connection Test Failed"}
                </strong>
                <small>
                  {connectionTestResult.message}
                  {connectionTestResult.timestamp &&
                    ` (${new Date(connectionTestResult.timestamp).toLocaleTimeString()})`}
                </small>
              </ConnectionTestMessage>
            </ConnectionTestBanner>
          )}

          <ButtonGroup>
            <Button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
            >
              {testingConnection ? "Testing..." : "Test Connection"}
            </Button>

            <Button type="submit" variant="primary" disabled={submitting}>
              <Play size={16} style={{ marginRight: "8px" }} />
              {submitting ? "Submitting..." : "Submit Task"}
            </Button>

            <Button type="button" onClick={() => navigate("/tasks")}>
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </FormCard>
    </PageContainer>
  );
};

export default SubmitTask;
