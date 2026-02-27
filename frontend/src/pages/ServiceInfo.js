import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Info, Server, Database, Code, RefreshCw, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { serviceInfoService } from '../services/serviceInfoService';
import { TES_INSTANCES } from '../utils/constants';

const ServiceInfoContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.div``;

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

const InstanceSelector = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  color: #374151;
  min-width: 300px;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const RefreshButton = styled.button`
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  svg.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
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



const NoDataMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
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

const ServiceInfo = () => {
  const [selectedInstance, setSelectedInstance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceInfo, setServiceInfo] = useState(null);
  const [tesInstances, setTesInstances] = useState([]);
  const [loadingInstances, setLoadingInstances] = useState(true);
 
  useEffect(() => {
    loadTesInstances();
  }, []);
 
  useEffect(() => {
    if (tesInstances.length > 0 && !selectedInstance) {
      setSelectedInstance(tesInstances[0].url);
    }
  }, [tesInstances, selectedInstance]);

  // Auto-load service info when instance is selected
  useEffect(() => {
    if (selectedInstance) {
      loadServiceInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstance]);
 
  const loadTesInstances = async () => {
    try {
      setLoadingInstances(true);
      
      // Get only healthy/working instances
      const healthyResponse = await serviceInfoService.getHealthyInstances();
      const healthyInstances = healthyResponse.instances || [];
      
      if (healthyInstances && healthyInstances.length > 0) {
        // Map to the format we need
        const instances = healthyInstances.map(instance => ({
          name: instance.name,
          url: instance.url,
          id: instance.url.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        }));
        setTesInstances(instances);
      } else {
        // Fallback to all instances if no healthy instances found
        const allInstances = await serviceInfoService.getTesInstances();
        if (allInstances && allInstances.length > 0) {
          setTesInstances(allInstances);
        } else {
          setTesInstances(TES_INSTANCES);
        }
      }
    } catch (err) {
      console.error('Failed to load healthy instances:', err);
      
      // Fallback to all instances
      try {
        const allInstances = await serviceInfoService.getTesInstances();
        setTesInstances(allInstances || TES_INSTANCES);
      } catch {
        setTesInstances(TES_INSTANCES);
      }
    } finally {
      setLoadingInstances(false);
    }
  };

  const loadServiceInfo = async () => {
    if (!selectedInstance) return;

    try {
      setLoading(true);
      setError('');
      const info = await serviceInfoService.getServiceInfo(selectedInstance);
       
      // Show a warning if there's an error flag, but still display the info
      if (info.error || info.auth_required) { 
        if (info.auth_required) {
          setError(`ℹ️ Authentication Required: This TES instance requires authentication for detailed service information.`);
        } else if (info.error_message) {
          setError(`⚠️ Limited Information: ${info.error_message}`);
        } else {
          setError(`⚠️ Could not retrieve complete service information.`);
        }
      }
      
      setServiceInfo(info);
    } catch (err) {
      console.error('Unexpected error fetching service info:', err);
      setError('❌ An unexpected error occurred while fetching service information. Please try again.');
      setServiceInfo(null);
    } finally {
      setLoading(false);
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

  const selectedInstanceName = tesInstances.find(i => i.url === selectedInstance)?.name || 'Unknown';

  return (
    <ServiceInfoContainer>
      <Header>
        <HeaderLeft>
          <Title>Service Information</Title>
          <Subtitle>View detailed information about TES service instances</Subtitle>
        </HeaderLeft>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <InstanceSelector
            value={selectedInstance}
            onChange={(e) => setSelectedInstance(e.target.value)}
            disabled={loadingInstances}
          >
            {loadingInstances ? (
              <option value="">Loading instances...</option>
            ) : (
              <>
                <option value="">Select TES Instance</option>
                {tesInstances.map((instance, idx) => (
                  <option key={idx} value={instance.url}>
                    {instance.name}
                  </option>
                ))}
              </>
            )}
          </InstanceSelector>
          <RefreshButton onClick={loadServiceInfo} disabled={loading || !selectedInstance} title="Refresh service information">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </RefreshButton>
        </div>
      </Header>

      {error && (
        <ErrorCard>
          <AlertTriangle size={16} />
          <div>{error}</div>
        </ErrorCard>
      )}

      {selectedInstance && (
        <ServiceInfoCard>
          <SectionTitle>
            <Info size={20} />
            Service Information - {selectedInstanceName}
          </SectionTitle>

          {loading ? (
            <LoadingSpinner text="Fetching service information..." />
          ) : serviceInfo ? (
            (() => {
              const formattedInfo = formatServiceInfo(serviceInfo);
              return (
                <InfoGrid>
                  <InfoSection>
                    <InfoSectionTitle>
                      <Server size={16} />
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
                      <Code size={16} />
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
                      <Database size={16} />
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
          ) : !error ? (
            <NoDataMessage>
              Click "Refresh" to load service information for this instance
            </NoDataMessage>
          ) : null}

        </ServiceInfoCard>
      )}
    </ServiceInfoContainer>
  );
};

export default ServiceInfo;
