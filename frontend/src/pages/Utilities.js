import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import api, { testConnection, fetchDashboardData } from '../services/api';
import { taskService } from '../services/taskService';
import { serviceInfoService } from '../services/serviceInfoService';
import { workflowService } from '../services/workflowService';
import { batchService } from '../services/batchService';
import { mapService } from '../services/mapService';
import { logService } from '../services/logService';
import useInstances from '../hooks/useInstances';
import AuthConfigModal from '../components/auth/AuthConfigModal';
import { 
  Server, Clock, AlertCircle, CheckCircle, Play, 
  ExternalLink, RotateCcw, Globe, Shield
} from 'lucide-react';

const UtilitiesContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
`;

const DiagnosticsSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const TESInstancesSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
`;

const SectionDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  ${props => props.$primary && `
    background: #2563eb;
    border-color: #2563eb;
    color: white;
    
    &:hover {
      background: #1d4ed8;
      border-color: #1d4ed8;
    }
  `}
`;

const LastUpdateIndicator = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoadingState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

const ErrorState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #dc2626;
  background: #fef2f2;
`;

const InstanceList = styled.div`
  display: flex;
  flex-direction: column;
`;

const InstanceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
  
  ${props => props.$status === 'error' && `
    background-color: #fef2f2;
    border-left: 4px solid #dc2626;
  `}
  
  ${props => props.$status === 'healthy' && `
    border-left: 4px solid #059669;
  `}
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
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  
  ${props => props.$status === 'healthy' ? `
    background: rgba(5, 150, 105, 0.1);
    color: #059669;
  ` : `
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  `}
`;

const InstanceDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  flex-wrap: wrap;
`;

const UrlText = styled.span`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const InstanceActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
  
  h3 {
    margin: 1rem 0 0.5rem 0;
    color: #374151;
  }
  
  p {
    margin: 0 0 1.5rem 0;
  }
`;

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
`;

const ServiceCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: #9ca3af;
  }
`;

const ServiceIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 0.5rem;
  
  ${props => props.$status === 'healthy' ? `
    background: rgba(5, 150, 105, 0.1);
    color: #059669;
  ` : `
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  `}
`;

const ServiceName = styled.div`
  font-weight: 500;
  color: #111827;
  text-align: center;
  margin-bottom: 0.25rem;
`;

const ServiceStatus = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
`;

const TestResult = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  background: ${props => props.$success ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)'};
  color: ${props => props.$success ? '#059669' : '#dc2626'};
  border: 1px solid ${props => props.$success ? 'rgba(5, 150, 105, 0.3)' : 'rgba(220, 38, 38, 0.3)'};
`;

const Utilities = () => { 
  const [services, setServices] = useState([
    { name: 'Backend API', status: 'healthy', url: '/api/dashboard_data' },
    { name: 'Database', status: 'healthy', url: null },
    { name: 'File Storage', status: 'healthy', url: null },
  ]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
 
  // ✅ NEW: State for ALL instances (including non-working)
  const [tesInstances, setTesInstances] = useState([]);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const [instancesError, setInstancesError] = useState(null);
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null);
 
  // API Test state
  const [apiTestResults, setApiTestResults] = useState({});
  const [apiTesting, setApiTesting] = useState(false);

  // ✅ NEW: Fetch ALL instances with status
  const loadInstancesWithStatus = useCallback(async () => {
    try {
      setInstancesLoading(true);
      setInstancesError(null);
      
      const response = await api.get('/api/instances-with-status');
      
      const instancesData = Array.isArray(response.data) 
        ? response.data 
        : response.data.instances || [];
      
      setTesInstances(instancesData);
      setLastStatusUpdate(new Date().toISOString());
      
    } catch (error) {
      console.error('Failed to load TES instances:', error);
      setInstancesError('Failed to load TES instances');
      setTesInstances([]);
    } finally {
      setInstancesLoading(false);
    }
  }, []);
 
  const checkServiceStatus = useCallback(async () => {
    try {
      setServicesLoading(true); 
      const currentServices = [
        { name: 'Backend API', status: 'healthy', url: '/api/dashboard_data' },
        { name: 'Database', status: 'healthy', url: null },
        { name: 'File Storage', status: 'healthy', url: null },
      ];
      
      const updatedServices = await Promise.all(
        currentServices.map(async (service) => {
          if (!service.url) {
            return { ...service, status: 'healthy' };
          }
          
          try {
            await api.get(service.url, { timeout: 5000 });
            return { ...service, status: 'healthy' };
          } catch (error) {
            return { ...service, status: 'error' };
          }
        })
      );
      
      setServices(updatedServices);
      setLastChecked(new Date());
      setServicesError(null);
    } catch (error) {
      setServicesError('Failed to check service status');
    } finally {
      setServicesLoading(false);
    }
  }, []);
 
  // Unified API test suite
  const runApiTests = useCallback(async () => {
    setApiTesting(true);
    setApiTestResults({});
    // Test 1: Basic connection
    try {
      await testConnection();
      setApiTestResults(prev => ({ ...prev, connection: { success: true, message: 'Backend connection successful' } }));
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, connection: { success: false, message: `Connection failed: ${error.message}` } }));
    }
    // Test 2: Dashboard data
    try {
      const data = await fetchDashboardData();
      setApiTestResults(prev => ({ ...prev, dashboardData: { success: true, message: `Dashboard data loaded: ${Object.keys(data).join(', ')}`, data } }));
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, dashboardData: { success: false, message: `Dashboard data failed: ${error.message}` } }));
    }
    // Test 3: Task service
    try {
      const tasks = await taskService.listTasks();
      setApiTestResults(prev => ({ ...prev, tasks: { success: true, message: `Tasks loaded: ${tasks.length} tasks found` } }));
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, tasks: { success: false, message: `Tasks failed: ${error.message}` } }));
    }
    // Test 4: Service info
    try {
      const dashboardData = await fetchDashboardData();
      const tesInstances = dashboardData.tes_instances || [];
      if (tesInstances.length > 0) {
        const testUrl = tesInstances[0].url;
        await serviceInfoService.getServiceInfo(testUrl);
        setApiTestResults(prev => ({ ...prev, serviceInfo: { success: true, message: 'Service info loaded successfully' } }));
      } else {
        setApiTestResults(prev => ({ ...prev, serviceInfo: { success: false, message: 'No TES instances available to test' } }));
      }
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, serviceInfo: { success: false, message: `Service info failed: ${error.message}` } }));
    }
    // Test 5: TES locations
    try {
      const locations = await mapService.getTesLocations();
      setApiTestResults(prev => ({ ...prev, tesLocations: { success: true, message: `TES locations loaded: ${locations.length} locations` } }));
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, tesLocations: { success: false, message: `TES locations failed: ${error.message}` } }));
    }
    // Test 6: Batch runs
    try {
      const runs = await batchService.getBatchRuns();
      setApiTestResults(prev => ({ ...prev, batchRuns: { success: true, message: `Batch runs loaded: ${runs.length} runs` } }));
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, batchRuns: { success: false, message: `Batch runs failed: ${error.message}` } }));
    }
    // Test 7: Workflow runs
    try {
      const runs = await workflowService.getWorkflowRuns();
      setApiTestResults(prev => ({ ...prev, workflowRuns: { success: true, message: `Workflow runs loaded: ${runs.length} runs` } }));
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, workflowRuns: { success: false, message: `Workflow runs failed: ${error.message}` } }));
    }
    // Test 8: All logs
    try {
      const logs = await logService.getTopologyLogs();
      setApiTestResults(prev => ({ ...prev, logs: { success: true, message: `Logs loaded: ${logs.length} log sources` } }));
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, logs: { success: false, message: `Logs failed: ${error.message}` } }));
    }
    // Test 9: Nodes
    try {
      const response = await api.get('/api/nodes');
      setApiTestResults(prev => ({ ...prev, nodes: { success: true, message: `Nodes loaded: ${response.data.length} nodes` } }));
    } catch (error) {
      setApiTestResults(prev => ({ ...prev, nodes: { success: false, message: `Nodes failed: ${error.message}` } }));
    }
    setApiTesting(false);
  }, []);

  const testInstanceConnection = async (url) => {
    const instance = tesInstances.find(inst => inst.url === url);
    const instanceName = instance?.name || url;
    
    try {
      const startTime = Date.now();
      const response = await api.get('/api/service_info', {
        params: { tes_url: url },
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
       
      // Refresh after test
      await loadInstancesWithStatus();
       
      const serviceInfo = response.data;
      let successMessage = `Connection Test Successful!\n\nInstance: ${instanceName}\nResponse Time: ${responseTime}ms`;
      
      if (serviceInfo && serviceInfo.name) {
        successMessage += `\nService Name: ${serviceInfo.name}`;
      }
      if (serviceInfo && serviceInfo.version) {
        successMessage += `\nVersion: ${serviceInfo.version}`;
      }
      
      alert(successMessage);
    } catch (error) { 
      let errorMessage = `Connection Test Failed\n\nInstance: ${instanceName}\nURL: ${url}\n\n`;
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        errorMessage += `Error: ${errorData.error || errorData.message || error.message || 'Unknown error'}`;
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage += `Error: Connection Timeout\n\nThe TES instance did not respond within 10 seconds.`;
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error occurred'}`;
      }
      
      alert(errorMessage);
    }
  };

  const refreshInstanceStatus = () => {
    loadInstancesWithStatus();
  }; 

  useEffect(() => { 
    const initialLoad = async () => {
      await checkServiceStatus();
      await loadInstancesWithStatus();
    };
    
    initialLoad();
    
    const interval = setInterval(() => {
      loadInstancesWithStatus();
      checkServiceStatus();
    }, 60 * 60 * 1000); 
    
    return () => clearInterval(interval); 
  }, [checkServiceStatus, loadInstancesWithStatus]); 

  useEffect(() => {
    runApiTests();
  }, [runApiTests]);

  return (
    <UtilitiesContainer>
      <PageHeader>
        <PageTitle>Diagnostics</PageTitle>
        <PageSubtitle>System diagnostics and API endpoint testing</PageSubtitle>
      </PageHeader>
 
      <DiagnosticsSection>
        <SectionHeader>
          <div>
            <SectionTitle>API Diagnostics</SectionTitle>
            <SectionDescription>
              Current status of core system services and API endpoints
            </SectionDescription>
          </div>
          <HeaderActions>
            <ActionButton onClick={checkServiceStatus}>
              <RotateCcw size={16} />
              Refresh Service Status
            </ActionButton>
            <ActionButton onClick={runApiTests} disabled={apiTesting}>
              <Play size={16} />
              {apiTesting ? 'Testing...' : 'Run API Tests'}
            </ActionButton>
            {lastChecked && (
              <LastUpdateIndicator>
                <Clock size={14} />
                Last checked: {lastChecked.toLocaleTimeString()}
              </LastUpdateIndicator>
            )}
          </HeaderActions>
        </SectionHeader>

        {/* Service Status Results */}
        {servicesLoading ? (
          <LoadingState>Checking service status...</LoadingState>
        ) : servicesError ? (
          <ErrorState>{servicesError}</ErrorState>
        ) : (
          <ServiceGrid>
            {services.map((service, index) => (
              <ServiceCard key={index}>
                <ServiceIcon $status={service.status}>
                  {service.status === 'healthy' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                </ServiceIcon>
                <ServiceName>{service.name}</ServiceName>
                <ServiceStatus>{service.status}</ServiceStatus>
              </ServiceCard>
            ))}
          </ServiceGrid>
        )}
      </DiagnosticsSection>
 
      <TESInstancesSection>
        <SectionHeader>
          <div>
            <SectionTitle>TES Instance Management</SectionTitle>
            <SectionDescription>
              Monitor and manage TES instances with real-time status checking. Status updates every hour.
            </SectionDescription>
          </div>
          <HeaderActions>
            <ActionButton onClick={() => setShowAuthModal(true)} $primary>
              <Shield size={16} />
              Configure Auth
            </ActionButton>
            <ActionButton onClick={refreshInstanceStatus}>
              <RotateCcw size={16} />
              Refresh Status
            </ActionButton>
            <LastUpdateIndicator>
              Last updated: {lastStatusUpdate ? new Date(lastStatusUpdate).toLocaleTimeString() : 'Never'}
            </LastUpdateIndicator>
          </HeaderActions>
        </SectionHeader>

        {instancesLoading ? (
          <LoadingState>Loading TES instances...</LoadingState>
        ) : instancesError ? (
          <ErrorState>{instancesError}</ErrorState>
        ) : (
          <InstanceList>
            {tesInstances.map((instance, index) => (
              <InstanceItem key={instance.id || `${instance.name}-${instance.url}-${index}`} $status={instance.status}>
                <InstanceInfo>
                  <InstanceHeader>
                    <InstanceName>{instance.name}</InstanceName>
                    <StatusBadge $status={instance.status}>
                      {instance.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {instance.status}
                    </StatusBadge>
                  </InstanceHeader>
                  
                  <InstanceDetails>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Server size={14} />
                      <UrlText>{instance.url}</UrlText>
                    </div>
                    {instance.country && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={14} />
                        {instance.country}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} />
                      Last checked: {instance.lastChecked ? new Date(instance.lastChecked).toLocaleString() : 'Never'}
                    </div>
                  </InstanceDetails>
                  
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
                
                <InstanceActions>
                  <ActionButton 
                    onClick={() => testInstanceConnection(instance.url)}
                    title="Test Connection"
                  >
                    <Play size={16} />
                  </ActionButton>
                  <ActionButton 
                    onClick={() => window.open(instance.url, '_blank')}
                    title="Open in Browser"
                  >
                    <ExternalLink size={16} />
                  </ActionButton>
                </InstanceActions>
              </InstanceItem>
            ))}
            
            {tesInstances.length === 0 && (
              <EmptyState>
                <Server size={48} />
                <h3>No TES Instances Found</h3>
                <p>No TES instances are currently available</p>
              </EmptyState>
            )}
          </InstanceList>
        )}
      </TESInstancesSection>
      
      <AuthConfigModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      {/* API Test Results */}
        <div style={{ marginTop: '2rem' }}>
          <SectionTitle>API Endpoint Checks</SectionTitle>
          {Object.entries(apiTestResults).map(([test, result]) => (
            <div key={test} style={{ marginBottom: '1rem' }}>
              <TestResult $success={result.success} $error={!result.success}>
                <strong>{result.success ? '✅' : '❌'} {test.charAt(0).toUpperCase() + test.slice(1)}:</strong> {result.message}
                {result.data && (
                  <details>
                    <summary>Show Data</summary>
                    <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </TestResult>
            </div>
          ))}
        </div>
    </UtilitiesContainer>
  );
};

export default Utilities;