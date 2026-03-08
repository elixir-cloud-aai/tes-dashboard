import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  applyEdgeChanges,
  applyNodeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import styled from "styled-components";
import { topologyService } from "../services/topologyService";

const MapContainer = styled.div`
  width: 100%;
  height: 400px;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const nodeStyle = {
  padding: "12px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: "600",
  width: 180,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const instanceStyle = {
  ...nodeStyle,
  background: "#ffffff",
  border: "2px solid #3b82f6",
  color: "#1e293b",
};

const workflowStyle = {
  ...nodeStyle,
  background: "#eff6ff",
  border: "2px solid #10b981",
  color: "#064e3b",
  textAlign: "center",
};

function TopologyMap({ workflowId }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  useEffect(() => {
    const fetchTopology = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await topologyService.getNetworkTopology();

        // Filter flows for this specific workflow
        const relevantFlows = (data.data_flows || []).filter(
          (f) => f.workflow_id === workflowId,
        );

        // Find instances involved in this workflow
        const activeInstanceIds = new Set(relevantFlows.map((f) => f.source));
        const involvedInstances = data.instances.filter((inst) =>
          activeInstanceIds.has(inst.id),
        );

        const nodesArr = [];
        const edgesArr = [];

        // 1. Create Workflow Central Node
        nodesArr.push({
          id: "workflow-root",
          data: { label: `Workflow Engine\n${workflowId.substring(0, 8)}...` },
          position: { x: 250, y: 0 },
          style: workflowStyle,
          type: "input",
        });

        // 2. Create Node for each involved TES Instance
        involvedInstances.forEach((inst, idx) => {
          const xPos = idx * 220;
          nodesArr.push({
            id: inst.id,
            data: { label: `${inst.name}\n${inst.region || inst.country}` },
            position: { x: xPos, y: 150 },
            style: instanceStyle,
          });

          // Connect root to instances
          edgesArr.push({
            id: `edge-root-${inst.id}`,
            source: "workflow-root",
            target: inst.id,
            label: "Command",
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
            labelStyle: { fill: "#065f46", fontWeight: 700, fontSize: 10 },
          });
        });

        // 3. Map Data Flows between nodes if available
        relevantFlows.forEach((flow, idx) => {
          if (flow.source && flow.target && flow.source !== flow.target) {
            edgesArr.push({
              id: `flow-${idx}`,
              source: flow.source,
              target: flow.target,
              label: `${flow.data_size}`,
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#3b82f6",
              },
              style: { stroke: "#3b82f6", strokeWidth: 3 },
              labelStyle: { fill: "#1e40af", fontWeight: 700, fontSize: 10 },
            });
          }
        });

        setNodes(nodesArr);
        setEdges(edgesArr);
      } catch (err) {
        console.error("Topology fetch error:", err);
        setError("Failed to map logical infrastructure");
      } finally {
        setLoading(false);
      }
    };

    if (workflowId) fetchTopology();
  }, [workflowId]);

  if (loading)
    return (
      <MapContainer>
        <div style={{ padding: 20 }}>Mapping logic...</div>
      </MapContainer>
    );
  if (error)
    return (
      <MapContainer>
        <div style={{ padding: 20, color: "#ef4444" }}>{error}</div>
      </MapContainer>
    );
  if (nodes.length === 0)
    return (
      <MapContainer>
        <div style={{ padding: 20 }}>
          No execution graph available for this run.
        </div>
      </MapContainer>
    );

  return (
    <MapContainer>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.id === "workflow-root") return "#10b981";
            return "#3b82f6";
          }}
          maskColor="rgba(241, 245, 249, 0.6)"
        />
      </ReactFlow>
    </MapContainer>
  );
}

export default TopologyMap;
