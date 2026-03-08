import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../services/api';
import { serviceInfoService } from '../services/serviceInfoService';
import { CheckCircle, AlertCircle, Play, ExternalLink, Info, Server, Code, Database } from 'lucide-react';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
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
  background: white;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`;

const InstanceInfo = styled.div`
  flex: 1;
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
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background: ${props => props.$status === 'healthy' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)'};
  color: ${props => props.$status === 'healthy' ? '#059669' : '#dc2626'};
`;

const InstanceActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DetailsPanel = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
  width: 100%;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const InfoSection = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
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
  &:last-child { border-bottom: none; }
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

const ConnectionTestResult = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: ${({ success }) => (success ? '#059669' : '#dc2626')};
  background: ${({ success }) => (success ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)')};
  border-radius: 6px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TESNetwork = () => {
  const [tesInstances, setTesInstances] = useState([]);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const [instancesError, setInstancesError] = useState(null);
  const [detailsIdx, setDetailsIdx] = useState(null);
  const [serviceInfo, setServiceInfo] = useState(null);
  const [serviceInfoLoading, setServiceInfoLoading] = useState(false);
  const [serviceInfoError, setServiceInfoError] = useState('');
  const [testResults, setTestResults] = useState({});
  const [testingIdx, setTestingIdx] = useState(null);

  useEffect(() => {
    const loadInstances = async () => {
      setInstancesLoading(true);
      setInstancesError(null);
      try {
        const response = await api.get('/api/instances-with-status');
        setTesInstances(Array.isArray(response.data) ? response.data : response.data.instances || []);
      } catch (err) {
        setInstancesError('Failed to load TES instances');
        setTesInstances([]);
      } finally {
        setInstancesLoading(false);
      }
    };
    loadInstances();
  }, []);

  const handleShowDetails = async (instance, idx) => {
    setDetailsIdx(idx);
    setServiceInfoLoading(true);
    setServiceInfoError('');
    try {
      const info = await serviceInfoService.getServiceInfo(instance.url);
      setServiceInfo(info);
    } catch (err) {
      setServiceInfoError('Failed to load service info');
      setServiceInfo(null);
    } finally {
      setServiceInfoLoading(false);
    }
  };

  const handleTestConnection = async (instance, idx) => {
    setTestingIdx(idx);
    setTestResults(prev => ({ ...prev, [idx]: { loading: true } }));
    try {
      const startTime = Date.now();
      const response = await api.get('/api/service_info', {
        params: { tes_url: instance.url },
        timeout: 10000
      });
      const responseTime = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [idx]: {
          loading: false,
          success: true,
          message: `Connection successful! Response time: ${responseTime}ms`,
        }
      }));
    } catch (error) {
      let message = 'Connection failed.';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        message = 'Connection timeout (10s).';
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message) {
        message = error.message;
      }
      setTestResults(prev => ({
        ...prev,
        [idx]: {
          loading: false,
          success: false,
          message,
        }
      }));
    } finally {
      setTestingIdx(null);
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
    <Container>
      <Title>TES Network</Title>
      {instancesLoading ? (
        <div>Loading TES instances...</div>
      ) : instancesError ? (
        <div style={{ color: '#dc2626' }}>{instancesError}</div>
      ) : (
        <InstanceList>
          {tesInstances.map((instance, idx) => (
            <InstanceItem key={instance.id || `${instance.name}-${instance.url}-${idx}`}> 
              <InstanceInfo>
                <InstanceHeader>
                  <InstanceName>{instance.name}</InstanceName>
                  <StatusBadge $status={instance.status}>
                    {instance.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {instance.status}
                  </StatusBadge>
                </InstanceHeader>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{instance.url}</div>
              </InstanceInfo>
              <InstanceActions>
                <button
                  onClick={() => handleTestConnection(instance, idx)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #059669', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 500 }}
                  disabled={testingIdx === idx}
                >
                  {testingIdx === idx ? 'Testing...' : 'Test Connection'}
                </button>
                {instance.status === 'healthy' && (
                  <button onClick={() => handleShowDetails(instance, idx)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #2563eb', background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 500 }}>
                    Details
                  </button>
                )}
                <button onClick={() => window.open(instance.url, '_blank')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>
                  <ExternalLink size={16} />
                </button>
              </InstanceActions>
              {testResults[idx] && !testResults[idx].loading && (
                <ConnectionTestResult success={testResults[idx].success}>
                  {testResults[idx].success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {testResults[idx].message}
                </ConnectionTestResult>
              )}
              {detailsIdx === idx && (
                <DetailsPanel>
                  {serviceInfoLoading ? (
                    <div>Loading service info...</div>
                  ) : serviceInfoError ? (
                    <div style={{ color: '#dc2626' }}>{serviceInfoError}</div>
                  ) : serviceInfo ? (
                    (() => {
                      const formatted = formatServiceInfo(serviceInfo);
                      return (
                        <InfoGrid>
                          <InfoSection>
                            <InfoSectionTitle><Server size={16} /> Basic Information</InfoSectionTitle>
                            {Object.entries(formatted.basicInfo).map(([key, value]) => (
                              <InfoItem key={key}><InfoLabel>{key}</InfoLabel><InfoValue>{value}</InfoValue></InfoItem>
                            ))}
                          </InfoSection>
                          <InfoSection>
                            <InfoSectionTitle><Code size={16} /> API Information</InfoSectionTitle>
                            {Object.entries(formatted.apiInfo).map(([key, value]) => (
                              <InfoItem key={key}><InfoLabel>{key}</InfoLabel><InfoValue>{value}</InfoValue></InfoItem>
                            ))}
                          </InfoSection>
                          <InfoSection>
                            <InfoSectionTitle><Database size={16} /> Storage Information</InfoSectionTitle>
                            {Object.entries(formatted.storageInfo).map(([key, value]) => (
                              <InfoItem key={key}><InfoLabel>{key}</InfoLabel><InfoValue>{value}</InfoValue></InfoItem>
                            ))}
                          </InfoSection>
                        </InfoGrid>
                      );
                    })()
                  ) : null}
                </DetailsPanel>
              )}
            </InstanceItem>
          ))}
        </InstanceList>
      )}
    </Container>
  );
};

export default TESNetwork;
