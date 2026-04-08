import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  Tooltip,
  ZoomControl,
  useMap,
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

const RefreshButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  &:hover {
    background: #f8fafc;
  }
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

// Component to handle auto-fitting bounds to steps
const FitBounds = ({ steps }) => {
  const map = useMap();
  useEffect(() => {
    if (steps && steps.length > 0 && map) {
      try {
        const validSteps = steps.filter(
          (s) => s && typeof s.lat === "number" && typeof s.lng === "number",
        );
        if (validSteps.length > 0) {
          const bounds = L.latLngBounds(validSteps.map((s) => [s.lat, s.lng]));
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], animate: false });
          }
        }
      } catch (e) {
        console.warn("Map bounds calculation skipped:", e);
      }
    }
  }, [steps, map]);
  return null;
};

function GeoTopologyMap({ workflowId, workflow: workflowProp }) {
  const [data, setData] = useState({ instances: [], steps: [], dataFlow: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        if (refreshKey === 0) setLoading(true);
        const [topology, workflow] = await Promise.all([
          topologyService.getNetworkTopology(),
          workflowProp
            ? Promise.resolve(workflowProp)
            : workflowService.getWorkflowRun(workflowId),
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

        // Map workflow steps to locations
        let workflowSteps = [];
        if (workflow?.steps && workflow.steps.length > 0) {
          workflowSteps = workflow.steps
            .map((step, idx) => {
              const inst = enrichedInstances.find(
                (i) =>
                  i.id === step.tes_instance_id ||
                  i.name === step.tes_instance_name,
              );
              return {
                ...step,
                idx,
                lat: inst?.lat || 0,
                lng: inst?.lng || 0,
                isValid: !!inst,
                instanceName: inst?.name || "Remote Node",
              };
            })
            .filter((s) => s.isValid);
        }

        // Use backend data_flow for polylines
        let dataFlow = [];
        if (workflow?.data_flow && workflow.data_flow.length > 0) {
          dataFlow = workflow.data_flow
            .map((flow) => {
              const fromInst =
                flow.from === "start"
                  ? null
                  : enrichedInstances.find((i) => i.id === flow.from);
              const toInst = enrichedInstances.find((i) => i.id === flow.to);
              if (flow.from === "start" && toInst) {
                return {
                  from: [toInst.lat - 1.2, toInst.lng - 0.5],
                  to: [toInst.lat, toInst.lng],
                };
              }
              return fromInst && toInst
                ? {
                    from: [fromInst.lat, fromInst.lng],
                    to: [toInst.lat, toInst.lng],
                  }
                : null;
            })
            .filter(Boolean);
        }

        setData({
          instances: enrichedInstances,
          steps: workflowSteps,
          dataFlow,
        });
      } catch (err) {
        console.error("Map Load Error:", err);
        setError("Map visualization failed");
      } finally {
        setLoading(false);
      }
    };

    if (workflowId || workflowProp) loadMapData();
  }, [workflowId, refreshKey, workflowProp]);

  const mapCenter = useMemo(() => {
    return [50, 10]; // Center on Europe
  }, []);

  if (loading)
    return (
      <MapWrapper>
        <div style={{ padding: 20 }}>Loading global fleet...</div>
      </MapWrapper>
    );

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <MapWrapper>
      <RefreshButton onClick={handleRefresh}>
        <span style={{ fontSize: "16px" }}>🔄</span> Manual Refresh
      </RefreshButton>
      <MapContainer
        center={mapCenter}
        zoom={3}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        whenCreated={(mapInstance) => {
          mapInstance.invalidateSize();
        }}
      >
        {data.steps && data.steps.length > 0 && (
          <FitBounds steps={data.steps} />
        )}
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

        {/* Data Flow Lines removed as redundant with workflow step connections */}

        {/* Draw polylines between all consecutive steps with different colors */}
        {data.steps.length > 1 &&
          data.steps.map((step, idx) => {
            if (idx === 0) return null;
            const prevStep = data.steps[idx - 1];

            // Use a color palette for each connection
            const colors = [
              "#6366f1",
              "#10b981",
              "#f59e42",
              "#ef4444",
              "#3b82f6",
              "#f472b6",
              "#facc15",
              "#38bdf8",
            ];
            const color = colors[(idx - 1) % colors.length];

            // Calculate offset positions to match the marker jittering
            const sameLocPrev = data.steps.filter(
              (s) => s.lat === prevStep.lat && s.lng === prevStep.lng,
            );
            const prevIndex = sameLocPrev.findIndex(
              (s) => s.idx === prevStep.idx,
            );
            const prevOffset =
              0.005 * (prevIndex - Math.floor(sameLocPrev.length / 2));

            const sameLocCurr = data.steps.filter(
              (s) => s.lat === step.lat && s.lng === step.lng,
            );
            const currIndex = sameLocCurr.findIndex((s) => s.idx === step.idx);
            const currOffset =
              0.005 * (currIndex - Math.floor(sameLocCurr.length / 2));

            // Simple straight line connection between steps
            return (
              <Polyline
                key={`step-connection-${idx}`}
                positions={[
                  [prevStep.lat + prevOffset, prevStep.lng + prevOffset],
                  [step.lat + currOffset, step.lng + currOffset],
                ]}
                color={color}
                weight={4}
                dashArray="10, 10"
                opacity={0.8}
                lineCap="round"
              />
            );
          })}

        {/* Step Markers with jittering and informative popups */}
        {data.steps &&
          data.steps.length > 0 &&
          data.steps.map((step, idx) => {
            // Find all steps at this location
            const sameLocSteps = data.steps.filter(
              (s) => s && s.lat === step.lat && s.lng === step.lng,
            );
            // Find this step's index among steps at this location
            const myIndex = sameLocSteps.findIndex((s) => s.idx === step.idx);
            // Apply a tiny offset to prevent perfect overlap but keep them on the node
            const offset =
              0.005 * (myIndex - Math.floor(sameLocSteps.length / 2));
            const lat = step.lat + offset;
            const lng = step.lng + offset;

            const st = (step.status || "").toLowerCase();

            // Fix: Ensure Step 2 doesn't show COMPLETED if Step 1 is still RUNNING
            let displayStatus = st;
            if (
              idx === 1 &&
              data.steps[0].status.toLowerCase() !== "complete"
            ) {
              displayStatus = data.steps[0].status.toLowerCase();
            }

            let color = "#3b82f6";
            if (displayStatus === "complete") color = "#10b981";
            if (
              st === "failed" ||
              st === "system_error" ||
              st === "canceled" ||
              st === "cancelled"
            )
              color = "#ef4444";
            if (idx === 0) color = "#f59e42";
            if (idx === data.steps.length - 1) color = "#6366f1";

            const stepInfo = step.name || `Step ${idx + 1}`;
            const isRunning =
              st === "running" || st === "queued" || st === "initializing";

            return (
              <Marker
                key={`step-${idx}`}
                position={[lat, lng]}
                icon={createStepIcon(color, idx + 1, isRunning)}
                zIndexOffset={1000}
              >
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "14px",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "4px",
                        marginBottom: "8px",
                      }}
                    >
                      {stepInfo}
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#64748b" }}>Execution Node:</span>
                      <br />
                      <strong>{step.instanceName}</strong>
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#64748b" }}>Exact Location:</span>
                      <br />
                      <code style={{ fontSize: "10px" }}>
                        {step.lat.toFixed(4)}, {step.lng.toFixed(4)}
                      </code>
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#64748b" }}>Current Step:</span>
                      <br />
                      <strong>
                        {idx + 1} of {data.steps.length}
                      </strong>
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#64748b" }}>Status:</span>
                      <br />
                      <span
                        style={{
                          color:
                            displayStatus === "complete"
                              ? "#10b981"
                              : st === "failed" || st === "system_error"
                                ? "#ef4444"
                                : "#3b82f6",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {displayStatus === "complete"
                          ? "COMPLETE"
                          : displayStatus.toUpperCase()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        marginBottom: "4px",
                        color: "#475569",
                      }}
                    >
                      {idx === 0
                        ? "Initial processing and container startup."
                        : idx === data.steps.length - 1
                          ? "Finalizing results and cleaning up environment."
                          : "Executing core workflow logic."}
                    </div>
                    {step.tes_task_id && (
                      <div
                        style={{
                          fontSize: "10px",
                          marginTop: "8px",
                          background: "#f1f5f9",
                          padding: "4px",
                          borderRadius: "4px",
                        }}
                      >
                        <span style={{ color: "#64748b" }}>TES Task ID:</span>
                        <br />
                        <code>{step.tes_task_id}</code>
                      </div>
                    )}
                    {step.start_time && (
                      <div style={{ fontSize: "10px", marginTop: "4px" }}>
                        <span style={{ color: "#64748b" }}>Started:</span>{" "}
                        {new Date(step.start_time).toLocaleString()}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

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
