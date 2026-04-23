import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { workflowService } from "../services/workflowService";
import usePolling from "../hooks/usePolling";
import ErrorMessage from "../components/common/ErrorMessage";
import { formatDate } from "../utils/formatters";
import {
  Plus,
  RefreshCw,
  Eye,
  Search,
  ChevronUp,
  ChevronDown,
  Workflow,
} from "lucide-react";

const PageContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 80px);
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  background: ${(props) =>
    props.variant === "primary"
      ? "#3b82f6"
      : props.variant === "success"
        ? "#10b981"
        : "#64748b"};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.variant === "primary"
        ? "#2563eb"
        : props.variant === "success"
          ? "#059669"
          : "#475569"};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  flex: 1;
  padding: 8px;
  font-size: 14px;
  outline: none;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #dee2e6;
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #e9ecef;
  }
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
  font-size: 14px;
  vertical-align: middle;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${(props) => {
    const s = String(props.status || "").toUpperCase();
    if (s === "COMPLETE" || s === "COMPLETED") return "#dcfce7";
    if (s === "RUNNING") return "#dbeafe";
    if (
      s === "FAILED" ||
      s === "SYSTEM_ERROR" ||
      s === "SUBMISSION_ERROR" ||
      s.includes("ERROR")
    )
      return "#fee2e2";
    if (s === "CANCELED" || s === "CANCELLED") return "#f1f5f9";
    return "#fef3c7";
  }};
  color: ${(props) => {
    const s = String(props.status || "").toUpperCase();
    if (s === "COMPLETE" || s === "COMPLETED") return "#166534";
    if (s === "RUNNING") return "#1e40af";
    if (
      s === "FAILED" ||
      s === "SYSTEM_ERROR" ||
      s === "SUBMISSION_ERROR" ||
      s.includes("ERROR")
    )
      return "#991b1b";
    if (s === "CANCELED" || s === "CANCELLED") return "#475569";
    return "#92400e";
  }};
`;

const Workflows = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRuns, setFilteredRuns] = useState([]);
  const [sortColumn, setSortColumn] = useState("submitted_at");
  const [sortDirection, setSortDirection] = useState("desc");

  const {
    data: workflowRuns,
    loading,
    error,
    refetch,
    silentLoading,
  } = usePolling(workflowService.getWorkflowRuns, 10000);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    let runs = Array.isArray(workflowRuns) ? workflowRuns : [];

    if (searchTerm) {
      runs = runs.filter(
        (r) =>
          r.run_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.tes_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.status?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    const sorted = [...runs].sort((a, b) => {
      let aVal = a[sortColumn] || "";
      let bVal = b[sortColumn] || "";
      if (sortColumn === "submitted_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      return sortDirection === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
          ? 1
          : -1;
    });

    setFilteredRuns(sorted);
  }, [workflowRuns, searchTerm, sortColumn, sortDirection]);

  if (loading && !silentLoading)
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "100px",
          }}
        >
          <RefreshCw className="animate-spin" size={32} color="#3b82f6" />
        </div>
      </PageContainer>
    );

  return (
    <PageContainer>
      <PageHeader>
        <Title>
          <Workflow size={28} /> Pipeline Workflows
        </Title>
        <ButtonGroup>
          <Button
            variant="success"
            onClick={() => navigate("/submit-workflow")}
          >
            <Plus size={16} style={{ marginRight: "8px" }} /> Submit Workflow
          </Button>
          <Button variant="primary" onClick={refetch}>
            <RefreshCw
              size={16}
              style={{ marginRight: "8px" }}
              className={silentLoading ? "animate-spin" : ""}
            />{" "}
            Refresh
          </Button>
        </ButtonGroup>
      </PageHeader>

      <ContentCard>
        <SearchBar>
          <Search size={18} color="#64748b" />
          <SearchInput
            placeholder="Filter workflows by ID, node, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {silentLoading && (
            <span
              style={{ fontSize: "12px", color: "#3b82f6", marginLeft: "10px" }}
            >
              Updating...
            </span>
          )}
        </SearchBar>

        {error && <ErrorMessage error={error} />}

        <Table>
          <thead>
            <tr>
              <TableHeader onClick={() => handleSort("run_id")}>
                Run ID
              </TableHeader>
              <TableHeader onClick={() => handleSort("status")}>
                Status
              </TableHeader>
              <TableHeader onClick={() => handleSort("tes_name")}>
                Execution Node
              </TableHeader>
              <TableHeader onClick={() => handleSort("submitted_at")}>
                Submitted
              </TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredRuns.map((run) => (
              <TableRow key={run.run_id}>
                <TableCell>
                  <code>{run.run_id.substring(0, 13)}...</code>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={
                      (run.status === "COMPLETE" &&
                        (!run.steps || run.steps.length === 0)) ||
                      run.status === "SUBMISSION_ERROR"
                        ? "SUBMISSION_ERROR"
                        : run.status
                    }
                  >
                    {(run.status === "COMPLETE" &&
                      (!run.steps || run.steps.length === 0)) ||
                    run.status === "SUBMISSION_ERROR"
                      ? "SUBMISSION_ERROR"
                      : run.status}
                  </StatusBadge>
                </TableCell>
                <TableCell>{run.tes_name}</TableCell>
                <TableCell>{formatDate(run.submitted_at)}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => navigate(`/workflows/details/${run.run_id}`)}
                  >
                    <Eye size={14} style={{ marginRight: "6px" }} /> Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredRuns.length === 0 && (
              <tr>
                <TableCell
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#64748b",
                  }}
                >
                  No workflows found.
                </TableCell>
              </tr>
            )}
          </tbody>
        </Table>
      </ContentCard>
    </PageContainer>
  );
};

export default Workflows;
