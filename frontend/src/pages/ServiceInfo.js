import React, { useState } from 'react';
import styled from 'styled-components';
import { CheckCircle, AlertCircle, Globe, Clock, RotateCcw, Shield } from 'lucide-react';
import { serviceInfoService } from '../services/serviceInfoService';
import AuthConfigModal from '../components/auth/AuthConfigModal';
import useInstances from '../hooks/useInstances';
import "./css/serviceinfo.css"


// Custom Tooltip component for instant display
const Tooltip = ({ children, content }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute',
          zIndex: 1000,
          left: '50%',
          bottom: '120%',
          transform: 'translateX(-50%)',
          background: '#222b45',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          whiteSpace: 'pre-line',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          pointerEvents: 'none',
          minWidth: '180px',
          maxWidth: '320px',
        }}>
          {content}
        </span>
      )}
    </span>
  );
};

const ServiceInfo = () => {
  // Use the custom hook for instance state and refresh
  const {
    allInstances: tesInstances,
    loading,
    error: instancesError,
    lastUpdate,
    refresh
  } = useInstances();
  const [detailsInstance, setDetailsInstance] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [detailsInfo, setDetailsInfo] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleShowDetails = async (instance) => {
    setDetailsInstance(instance);
    setDetailsLoading(true);
    setDetailsError("");
    setDetailsInfo(null);
    try {
      const info = await serviceInfoService.getServiceInfo(instance.url);
      setDetailsInfo(info);
    } catch (err) {
      setDetailsError("Failed to load service info");
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatServiceInfo = (info) => {
    if (!info) return null;

    const basicInfo = {
      'Service Name': info.name || 'Unknown',
      'Service Version': info.version || 'Unknown',
      'Service ID': info.id || 'Unknown',
      'Organization Name': info.organization?.name || 'Unknown',
      'Created At': info.createdAt || 'Unknown',
      'Description': info.description || 'N/A',
      'Organization URL': info.organization?.url || 'Unknown',
      'Contact URL': info.contactUrl || 'Unknown',
      'Documentation URL': info.documentationUrl || 'Unknown',
    };

    const apiInfo = {
      'API Version': info.type?.version || 'Unknown',
      'API Group': info.type?.group || 'Unknown',
      'API Artifact': info.type?.artifact || 'Unknown',
    };

    const storageInfo = {
      'Storage Type': info.storage?.join(', ') || 'Unknown',
      'Environment': info.environment || 'Unknown',
      'Version': info.version || 'Unknown',
    };

    return { basicInfo, apiInfo, storageInfo };
  };

  const isInstanceHealthy = (instance) => {
    // Consider an instance healthy only if status is 'healthy' and service-info returns a valid name, version, and no error/404
    if (instance.status !== 'healthy' && instance.status !== 'Auth Required (401)') return false;
    // If serviceInfo is present, check for error or 404
    if (instance.serviceInfo) {
      if (instance.serviceInfo.status === 404 || instance.serviceInfo.title === 'Not Found' || instance.serviceInfo.error) {
        return false;
      }
      // If serviceInfo has a name and type, consider healthy
      if (instance.serviceInfo.name && instance.serviceInfo.type && !instance.serviceInfo.error) {
        return true;
      }
      return false;
    }
    // Only check status for Details button visibility
    return instance.status === 'healthy' || instance.status === 'Auth Required (401)';
  };

  const getInstanceError = (instance) => {
    if (instance.error) return instance.error;
    if (instance.serviceInfo) {
      if (instance.serviceInfo.status === 404 || instance.serviceInfo.title === 'Not Found') {
        return 'Not Found (404) - Service info endpoint not found or requires authentication.';
      }
      if (instance.serviceInfo.error) {
        return instance.serviceInfo.errorMessage || instance.serviceInfo.error || 'Unknown error';
      }
      if (instance.serviceInfo.auth_required) {
        return 'Authentication required for service info.';
      }
    }
    return null;
  };

  // Helper to provide detailed status explanations for tooltips
  const getStatusExplanation = (instance) => {
    const status = instance.status ? instance.status.toLowerCase() : '';
    // Show backend error detail for unauthorized
    if ((status === 'auth required (401)' || status === 'unauthorized' || instance.http_status === 401) && instance.response_content) {
      let detail = '';
      if (typeof instance.response_content === 'object') {
        detail = JSON.stringify(instance.response_content, null, 2);
      } else {
        detail = String(instance.response_content);
      }
      return `Unauthorized (401): The TES instance requires authentication.\nDetails: ${detail}`;
    }
    if (status === 'healthy') {
      return 'The TES instance is reachable and responded successfully to health and service-info checks.';
    }
    if (status === 'auth required (401)') {
      return 'Authentication is required to access this TES instance. Please configure credentials.';
    }
    if (status === 'forbidden (403)') {
      return 'Access to this TES instance is forbidden (HTTP 403). Your credentials may lack permission or IP may be blocked.';
    }
    if (status === 'not found (404)') {
      return 'The TES instance responded with 404 Not Found. The service-info endpoint may not exist or the URL is incorrect.';
    }
    if (status === 'connection failed') {
      return 'The TES instance could not be reached. The server may be down, the URL may be incorrect, or there is a network issue.';
    }
    if (status === 'unreachable') {
      return 'The TES instance is unreachable. This may be due to network issues, downtime, or incorrect configuration.';
    }
    if (status === 'error') {
      return instance.error || 'An unknown error occurred while checking the TES instance.';
    }
    return instance.status_detail || instance.error || 'Status unknown.';
  };

   return (
    <div className="service-info-container">
      <div className="header">
        <h1 className="title">TES Instance Management</h1>
        <p className="subtitle">
          Monitor and manage TES instances with real-time status checking. Status updates every hour.
        </p>
      </div>

      <div className="section-header">
        <div>
          <h2 className="section-title">TES Instances</h2>

          <div className="last-update-indicator">
            <Clock size={14} />
            Last updated:{" "}
            {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : "Never"}
          </div>
        </div>

        <div className="header-actions">
          <button
            className="primary-btn"
            onClick={() => setShowAuthModal(true)}
          >
            <Shield size={16} />
            Configure Auth
          </button>

          <button
            className="secondary-btn"
            onClick={refresh}
          >
            <RotateCcw size={16} />
            Refresh Status
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          Loading TES instances...
        </div>
      ) : instancesError ? (
        <div className="error-state">
          {instancesError}
        </div>
      ) : (
        <div className="instance-list">
          {tesInstances.map((instance, index) => (
            <React.Fragment
              key={instance.id || `${instance.name}-${instance.url}-${index}`}
            >
              <div className={`instance-item ${instance.status}`}>
                <div className="instance-info">

                  <div className="instance-header">
                    <h3 className="instance-name">
                      {instance.name}
                    </h3>

                    <Tooltip content={getStatusExplanation(instance)}>
                      <span className={`status-badge ${instance.status}`}>
                        {instance.status === "healthy" ? (
                          <CheckCircle size={14} />
                        ) : instance.status === "unreachable" ? (
                          <AlertCircle size={14} color="#f59e42" />
                        ) : (
                          <AlertCircle size={14} color="#dc2626" />
                        )}

                        {instance.status}
                      </span>
                    </Tooltip>
                  </div>

                  <div className="instance-url">
                    {instance.url}
                  </div>

                  <div className="instance-meta">
                    <Clock size={14} />
                    Last checked:{" "}
                    {instance.lastChecked
                      ? new Date(instance.lastChecked).toLocaleString()
                      : "Never"}
                  </div>

                  {instance.country && (
                    <div className="instance-meta">
                      <Globe size={14} />
                      {instance.country}
                    </div>
                  )}

                  {instance.responseTime && (
                    <div className="response-time">
                      Response time: {instance.responseTime}ms
                    </div>
                  )}

                  {getInstanceError(instance) && (
                    <div className="instance-error">
                      Error: {getInstanceError(instance)}
                    </div>
                  )}
                </div>

                <div className="instance-actions">
                  {instance.status?.toLowerCase() === "healthy" && (
                    <button
                      className="details-btn"
                      onClick={() => handleShowDetails(instance)}
                    >
                      Details
                    </button>
                  )}

                  <button
                    className="open-btn"
                    onClick={() => window.open(instance.url, "_blank")}
                  >
                    Open
                  </button>
                </div>
              </div>

              {detailsInstance &&
                detailsInstance.url === instance.url && (
                  <div className="service-info-card">

                    <h2 className="section-title">
                      Service Information - {detailsInstance.name}
                    </h2>

                    {detailsLoading ? (
                      <div className="loading-state">
                        Fetching service information...
                      </div>
                    ) : detailsError ? (
                      <div className="error-card">
                        {detailsError}
                      </div>
                    ) : detailsInfo ? (
                      (() => {
                        const formattedInfo = formatServiceInfo(detailsInfo);

                        return (
                          <div className="info-grid">

                            <div className="info-section">
                              <h3 className="info-section-title">
                                Basic Information
                              </h3>

                              {Object.entries(formattedInfo.basicInfo)
                                .filter(([_, value]) =>
                                  typeof value === "string"
                                    ? !["unknown", "n/a"].includes(value.trim().toLowerCase())
                                    : true
                                )
                                .map(([key, value]) => (
                                  <div className="info-item" key={key}>
                                    <span className="info-label">{key}</span>
                                    <span className="info-value">{value}</span>
                                  </div>
                                ))}
                            </div>

                            <div className="info-section">
                              <h3 className="info-section-title">
                                API Information
                              </h3>

                              {Object.entries(formattedInfo.apiInfo)
                                .filter(([_, value]) =>
                                  typeof value === "string"
                                    ? !["unknown", "n/a"].includes(value.trim().toLowerCase())
                                    : true
                                )
                                .map(([key, value]) => (
                                  <div className="info-item" key={key}>
                                    <span className="info-label">{key}</span>
                                    <span className="info-value">{value}</span>
                                  </div>
                                ))}
                            </div>

                            <div className="info-section">
                              <h3 className="info-section-title">
                                Storage Information
                              </h3>

                              {Object.entries(formattedInfo.storageInfo)
                                .filter(([_, value]) =>
                                  typeof value === "string"
                                    ? !["unknown", "n/a"].includes(value.trim().toLowerCase())
                                    : true
                                )
                                .map(([key, value]) => (
                                  <div className="info-item" key={key}>
                                    <span className="info-label">{key}</span>
                                    <span className="info-value">{value}</span>
                                  </div>
                                ))}
                            </div>

                          </div>
                        );
                      })()
                    ) : null}

                  </div>
                )}
            </React.Fragment>
          ))}
        </div>
      )}

      <AuthConfigModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default ServiceInfo;
