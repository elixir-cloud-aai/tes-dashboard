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
                    <StatusBadge $status={instance.status}>
                      {instance.status === 'healthy' ? <CheckCircle size={14} /> : instance.status === 'unreachable' ? <AlertCircle size={14} color="#f59e42" /> : <AlertCircle size={14} color="#dc2626" />}
                      {instance.status}
                    </StatusBadge>
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
                  {instance.error && (
                    <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px' }}>
                      Error: {instance.error}
                    </div>
                  )}
                </InstanceInfo>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {instance.status === 'healthy' && (
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
                            {Object.entries(formattedInfo.basicInfo).map(([key, value]) => (
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
                            {Object.entries(formattedInfo.apiInfo).map(([key, value]) => (
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
                            {Object.entries(formattedInfo.storageInfo).map(([key, value]) => (
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
