import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  Tooltip,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styled from "styled-components";
import { topologyService } from "../services/topologyService";
import { workflowService } from "../services/workflowService";

// Fix for default Leaflet icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapWrapper = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  background: #f1f5f9;
`;

const Legend = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  font-size: 11px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const ColorBox = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => props.color};
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const createStepIcon = (color, label, isPulse = false) =>
  new L.DivIcon({
    className: "custom-step-marker",
    html: `
    <div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 12px;
      position: relative;
      ${isPulse ? "animation: pulse 2s infinite;" : ""}
    ">
      ${label}
      ${isPulse ? '<div style="position:absolute; width:100%; height:100%; border-radius:50%; border:2px solid ' + color + '; animation: ripple 2s infinite;"></div>' : ""}
    </div>
    <style>
      @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
      @keyframes ripple { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
    </style>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

function GeoTopologyMap({ workflowId }) {
  const [data, setData] = useState({ instances: [], steps: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        const [topology, workflow] = await Promise.all([
          topologyService.getNetworkTopology(),
          workflowService.getWorkflowRun(workflowId),
        ]);

        if (!topology || !topology.instances) {
          throw new Error("No topology data");
        }

        // Jitter function to prevent overlapping markers at the same coordinates
        const jitter = (instances) => {
          const coordMap = new Map();
          return instances.map((inst) => {
            const key = `${inst.lat.toFixed(2)},${inst.lng.toFixed(2)}`;
            const count = coordMap.get(key) || 0;
            coordMap.set(key, count + 1);

            if (count > 0) {
              return {
                ...inst,
                lat: inst.lat + (Math.random() - 0.5) * 0.15 * count,
                lng: inst.lng + (Math.random() - 0.5) * 0.15 * count,
              };
            }
            return inst;
          });
        };

        const enrichedInstances = jitter(
          topology.instances.map((inst) => ({
            ...inst,
            status: inst.status || "unreachable",
          })),
        );

        // Map workflow tasks to locations
        let workflowSteps = [];
        if (workflow?.tasks && workflow.tasks.length > 0) {
          workflowSteps = workflow.tasks
            .map((task, idx) => {
              const inst = enrichedInstances.find(
                (i) =>
                  i.id === task.tes_instance_id || i.name === task.tes_name,
              );
              return {
                ...task,
                idx,
                lat: inst?.lat || 0,
                lng: inst?.lng || 0,
                isValid: !!inst,
                instanceName: inst?.name || "Remote Node",
              };
            })
            .filter((s) => s.isValid);
        } else if (workflow?.tes_name) {
          const inst = enrichedInstances.find(
            (i) => i.name === workflow.tes_name,
          );
          if (inst) {
            workflowSteps = [
              {
                idx: 0,
                name: "Workflow Execution",
                status: workflow.status,
                lat: inst.lat,
                lng: inst.lng,
                instanceName: inst.name,
              },
            ];
          }
        }

        const stepEdges = [];
        for (let i = 0; i < workflowSteps.length - 1; i++) {
          if (workflowSteps[i].lat !== workflowSteps[i + 1].lat) {
            stepEdges.push({
              from: [workflowSteps[i].lat, workflowSteps[i].lng],
              to: [workflowSteps[i + 1].lat, workflowSteps[i + 1].lng],
            });
          }
        }

        setData({
          instances: enrichedInstances,
          steps: workflowSteps,
          edges: stepEdges,
        });
      } catch (err) {
        console.error("Map Load Error:", err);
        setError("Map visualization failed");
      } finally {
        setLoading(false);
      }
    };

    if (workflowId) loadMapData();
  }, [workflowId]);

  const mapCenter = useMemo(() => {
    return [50, 10]; // Center on Europe
  }, []);

  if (loading)
    return (
      <MapWrapper>
        <div style={{ padding: 20 }}>Loading global fleet...</div>
      </MapWrapper>
    );

  return (
    <MapWrapper>
      <MapContainer
        center={mapCenter}
        zoom={3}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; CARTO"
        />

        {/* Fleet Infrastructure */}
        {data.instances.map((inst) => (
          <Marker
            key={inst.id}
            position={[inst.lat, inst.lng]}
            icon={
              new L.Icon({
                iconUrl:
                  inst.status === "healthy"
                    ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
                    : inst.status === "unreachable"
                      ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
                      : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
                shadowUrl:
                  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
              })
            }
          >
            <Popup>
              <div style={{ fontWeight: 700 }}>{inst.name}</div>
              <div style={{ fontSize: "11px" }}>{inst.url}</div>
              <div style={{ marginTop: "5px" }}>
                Status:{" "}
                <span
                  style={{
                    fontWeight: 800,
                    color:
                      inst.status === "healthy"
                        ? "#10b981"
                        : inst.status === "unreachable"
                          ? "#ef4444"
                          : "#f59e0b",
                  }}
                >
                  {inst.status.toUpperCase()}
                </span>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -40]}>
              {inst.name}
            </Tooltip>
          </Marker>
        ))}

        {/* Workflow Connections */}
        {data.edges.map((edge, idx) => (
          <Polyline
            key={`edge-${idx}`}
            positions={[edge.from, edge.to]}
            color="#3b82f6"
            weight={3}
            dashArray="5, 10"
            opacity={0.5}
          />
        ))}

        {/* Active Workflow Steps */}
        {data.steps.map((step, idx) => (
          <Marker
            key={`step-${idx}`}
            position={[step.lat, step.lng]}
            icon={createStepIcon(
              idx === 0
                ? "#10b981"
                : idx === data.steps.length - 1
                  ? "#ef4444"
                  : "#3b82f6",
              idx + 1,
              step.status === "RUNNING",
            )}
            zIndexOffset={1000}
          >
            <Popup>
              <div style={{ fontWeight: 700 }}>
                Step ${idx + 1}: ${step.name}
              </div>
              <div style={{ fontSize: "11px" }}>Node: ${step.instanceName}</div>
              <div style={{ fontWeight: 800, color: "#3b82f6" }}>
                Status: ${step.status}
              </div>
            </Popup>
          </Marker>
        ))}

        <Legend>
          <div style={{ fontWeight: 700, marginBottom: "5px" }}>
            FLEET STATUS
          </div>
          <LegendItem>
            <ColorBox color="#10b981" /> Healthy
          </LegendItem>
          <LegendItem>
            <ColorBox color="#f59e0b" /> Unhealthy
          </LegendItem>
          <LegendItem>
            <ColorBox color="#ef4444" /> Unreachable
          </LegendItem>
          <div style={{ fontWeight: 700, margin: "10px 0 5px 0" }}>
            WORKFLOW
          </div>
          <LegendItem>
            <ColorBox color="#3b82f6" /> Active Step
          </LegendItem>
        </Legend>
      </MapContainer>
    </MapWrapper>
  );
}

export default GeoTopologyMap;
