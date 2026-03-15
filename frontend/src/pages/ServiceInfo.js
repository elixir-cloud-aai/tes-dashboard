import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Info, Server, Database, Code, AlertTriangle, CheckCircle, AlertCircle, Play, ExternalLink, Globe, Clock, RotateCcw, Shield } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { serviceInfoService } from '../services/serviceInfoService';
import api from '../services/api';
import AuthConfigModal from '../components/auth/AuthConfigModal';
import useInstances from '../hooks/useInstances';

const ServiceInfoContainer = styled.div`
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

const ServiceInfoCard = styled.div`
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

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const InfoSection = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
`;

const InfoSectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #222b45;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-weight: 500;
  color: #222b45;
  text-align: right;
  max-width: 200px;
  word-break: break-all;
`;

const ErrorCard = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc2626;
`;

const InstanceList = styled.div`
  display: flex;
  flex-direction: column;
`;

const InstanceItem = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
  border-left: 4px solid transparent;
  background: ${({ $status }) =>
    $status === 'healthy' ? 'rgba(16, 185, 129, 0.06)' :
    $status === 'unreachable' ? 'rgba(251, 191, 36, 0.08)' :
    $status === 'error' ? 'rgba(254, 202, 202, 0.12)' :
    '#fff'};
  border-left-color: ${({ $status }) =>
    $status === 'healthy' ? '#059669' :
    $status === 'unreachable' ? '#f59e42' :
    $status === 'error' ? '#dc2626' :
    'transparent'};
  &:last-child { border-bottom: none; }
  &:hover { background-color: #f3f4f6; }
`;

const InstanceInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InstanceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const InstanceName = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

// Forward the title prop to the span for tooltips
const StatusBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ $status }) =>
    $status === 'healthy' ? 'rgba(16, 185, 129, 0.15)' :
    $status === 'unreachable' ? 'rgba(251, 191, 36, 0.18)' :
    $status === 'error' ? 'rgba(254, 202, 202, 0.18)' :
    '#f3f4f6'};
  color: ${({ $status }) =>
    $status === 'healthy' ? '#059669' :
    $status === 'unreachable' ? '#b45309' :
    $status === 'error' ? '#dc2626' :
    '#6b7280'};
  border: 1px solid
    ${({ $status }) =>
      $status === 'healthy' ? 'rgba(16, 185, 129, 0.3)' :
      $status === 'unreachable' ? 'rgba(251, 191, 36, 0.4)' :
      $status === 'error' ? 'rgba(254, 202, 202, 0.4)' :
      '#e5e7eb'};
`;

const SectionHeader = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LastUpdateIndicator = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

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
    <ServiceInfoContainer>
      <Header>
        <Title>TES Instance Management</Title>
        <Subtitle>Monitor and manage TES instances with real-time status checking. Status updates every hour.</Subtitle>
      </Header>
      <SectionHeader>
        <div>
          <SectionTitle>TES Instances</SectionTitle>
          <LastUpdateIndicator>
            <Clock size={14} />
            Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
          </LastUpdateIndicator>
        </div>
        <HeaderActions>
          <button onClick={() => setShowAuthModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 500, cursor: 'pointer' }}>
            <Shield size={16} />
            Configure Auth
          </button>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 500, cursor: 'pointer' }}>
            <RotateCcw size={16} />
            Refresh Status
          </button>
        </HeaderActions>
      </SectionHeader>
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading TES instances...</div>
      ) : instancesError ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626', background: '#fef2f2' }}>{instancesError}</div>
      ) : (
        <InstanceList>
          {tesInstances.map((instance, index) => (
            <React.Fragment key={instance.id || `${instance.name}-${instance.url}-${index}`}>
              <InstanceItem $status={instance.status}>
                <InstanceInfo>
                  <InstanceHeader>
                    <InstanceName>{instance.name}</InstanceName>
                    <Tooltip content={getStatusExplanation(instance)}>
                      <StatusBadge $status={instance.status}>
                        {instance.status === 'healthy' ? <CheckCircle size={14} /> : instance.status === 'unreachable' ? <AlertCircle size={14} color="#f59e42" /> : <AlertCircle size={14} color="#dc2626" />}
                        {instance.status}
                      </StatusBadge>
                    </Tooltip>
                  </InstanceHeader>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{instance.url}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Clock size={14} />
                    Last checked: {instance.lastChecked ? new Date(instance.lastChecked).toLocaleString() : 'Never'}
                  </div>
                  {instance.country && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Globe size={14} />
                      {instance.country}
                    </div>
                  )}
                  {instance.responseTime && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Response time: {instance.responseTime}ms
                    </div>
                  )}
                  {getInstanceError(instance) && (
                    <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px' }}>
                      Error: {getInstanceError(instance)}
                    </div>
                  )}
                </InstanceInfo>
                {/* Debug: log status for troubleshooting */}
                {console.log('Instance:', instance.name, 'Status:', instance.status)}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(instance.status && instance.status.toLowerCase() === 'healthy') && (
                    <button onClick={() => handleShowDetails(instance)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #2563eb', background: '#2563eb', color: 'white', cursor: 'pointer' }}>Details</button>
                  )}
                  <button onClick={() => window.open(instance.url, '_blank')} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer' }}>Open</button>
                </div>
              </InstanceItem>
              {detailsInstance && detailsInstance.url === instance.url && (
                <ServiceInfoCard>
                  <SectionTitle>
                    Service Information - {detailsInstance.name}
                  </SectionTitle>
                  {detailsLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Fetching service information...</div>
                  ) : detailsError ? (
                    <div style={{ padding: '1rem', color: '#dc2626', background: '#fef2f2', borderRadius: '8px' }}>{detailsError}</div>
                  ) : detailsInfo ? (
                    (() => {
                      const formattedInfo = formatServiceInfo(detailsInfo);
                      return (
                        <InfoGrid>
                          <InfoSection>
                            <InfoSectionTitle>
                              Basic Information
                            </InfoSectionTitle>
                            {Object.entries(formattedInfo.basicInfo)
                              .filter(([_, value]) => typeof value === 'string' ? !['unknown', 'n/a'].includes(value.trim().toLowerCase()) : true)
                              .map(([key, value]) => (
                                <InfoItem key={key}>
                                  <InfoLabel>{key}</InfoLabel>
                                  <InfoValue>{value}</InfoValue>
                                </InfoItem>
                            ))}
                          </InfoSection>
                          <InfoSection>
                            <InfoSectionTitle>
                              API Information
                            </InfoSectionTitle>
                            {Object.entries(formattedInfo.apiInfo)
                              .filter(([_, value]) => typeof value === 'string' ? !['unknown', 'n/a'].includes(value.trim().toLowerCase()) : true)
                              .map(([key, value]) => (
                                <InfoItem key={key}>
                                  <InfoLabel>{key}</InfoLabel>
                                  <InfoValue>{value}</InfoValue>
                                </InfoItem>
                            ))}
                          </InfoSection>
                          <InfoSection>
                            <InfoSectionTitle>
                              Storage Information
                            </InfoSectionTitle>
                            {Object.entries(formattedInfo.storageInfo)
                              .filter(([_, value]) => typeof value === 'string' ? !['unknown', 'n/a'].includes(value.trim().toLowerCase()) : true)
                              .map(([key, value]) => (
                                <InfoItem key={key}>
                                  <InfoLabel>{key}</InfoLabel>
                                  <InfoValue>{value}</InfoValue>
                                </InfoItem>
                            ))}
                          </InfoSection>
                        </InfoGrid>
                      );
                    })()
                  ) : null}
                </ServiceInfoCard>
              )}
            </React.Fragment>
          ))}
        </InstanceList>
      )}
      <AuthConfigModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </ServiceInfoContainer>
  );
};

export default ServiceInfo;
