import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import useInstances from '../hooks/useInstances';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import ECCClientGa4ghTesCreateRun from '@elixir-cloud/tes/dist/react/create-run/index';

const PageContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 80px);
`;

const BackButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-bottom: 20px;
  
  &:hover {
    background: #5a6268;
  }
`;

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 900px;
`;

const Title = styled.h1`
  margin: 0 0 30px 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const Button = styled.button`
  background: ${props => 
    props.variant === 'primary' ? '#007bff' : 
    props.variant === 'demo' ? '#28a745' :
    '#6c757d'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusNotification = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HelpText = styled.small`
  color: #6c757d;
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

const CreateRunContainer = styled.div`
  margin-top: 24px;
`;

const SubmitTask = () => {
  const navigate = useNavigate();
  const [selectedInstanceUrl, setSelectedInstanceUrl] = useState('');

  const { 
    instances, 
    allInstances,
    loading: instancesLoading, 
    error: instancesError,
    refresh: refreshInstances 
  } = useInstances();

  const isReachableInstance = (instance) => (
    instance?.status === 'healthy' && instance?.service_info_reachable !== false
  );

  const requiresAuthorization = (instance) => (
    instance?.service_info_auth_required === true || instance?.task_access === 'authentication_required'
  );

  const isRunnableInstance = (instance) => (
    isReachableInstance(instance) && instance?.task_submission_available === true && !requiresAuthorization(instance)
  );

  const getInstanceCapabilitySymbol = (instance) => {
    if (isRunnableInstance(instance)) {
      return '✅';
    }

    if (requiresAuthorization(instance)) {
      return '🔒';
    }

    if (isReachableInstance(instance)) {
      return '⚠️';
    }

    return '❌';
  };

  const getInstanceCapabilityLabel = (instance) => {
    if (isRunnableInstance(instance)) {
      return 'ready: healthy';
    }

    if (requiresAuthorization(instance)) {
      return 'not ready: healthy, auth required';
    }

    if (isReachableInstance(instance)) {
      return 'not ready: healthy, unavailable';
    }

    return 'not ready: unhealthy, unreachable';
  };

  const hasUsableUrl = (instance) => {
    return typeof instance?.url === 'string' && instance.url.trim() !== '';
  };

  const instanceOptions = (allInstances.length > 0 ? allInstances : instances).filter(hasUsableUrl);
  const selectedInstance = instanceOptions.find(instance => instance.url === selectedInstanceUrl);
  const hasInvalidSelectedInstance = Boolean(selectedInstanceUrl) && (!selectedInstance || !isRunnableInstance(selectedInstance));

  const getTesBaseUrl = (instance) => {
    if (!instance) return '';
    if (instance.task_endpoint) {
      return instance.task_endpoint.replace(/\/tasks\/?$/, '');
    }
    const cleanUrl = (instance.url || '').trim().replace(/\/+$/, '').replace(/\/tasks\/?$/, '');
    if (cleanUrl.endsWith('/ga4gh/tes/v1') || cleanUrl.endsWith('/v1')) {
      return cleanUrl;
    }
    return `${cleanUrl}/ga4gh/tes/v1`;
  };

  const tesBaseUrl = getTesBaseUrl(selectedInstance);

  useEffect(() => {
    // Auto-select the first instance that is healthy, reachable, and does not require authorization.
    const runnableInstance = instanceOptions.find(
      instance => isRunnableInstance(instance)
    );

    if (!runnableInstance) {
      return;
    }

    setSelectedInstanceUrl(prev => {
      if (prev) {
        return prev;
      }

      return runnableInstance.url;
    });
  }, [instances, allInstances]);

  if (instancesLoading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Loading TES instances..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton onClick={() => navigate('/tasks')}>
        <ArrowLeft size={16} style={{ marginRight: '8px' }} />
        Back to Tasks
      </BackButton>

      <FormCard>
        <Title>Submit New Task</Title>
        
        {instancesError && <ErrorMessage error={instancesError} />}

        {hasInvalidSelectedInstance && (
          <StatusNotification>
            ⚠️ The selected TES instance is not suitable. Choose one marked ✅ ready to ensure it is healthy, reachable, and does not require authorization.
          </StatusNotification>
        )}
        
        {instanceOptions.filter(isRunnableInstance).length === 0 && !instancesLoading && (
          <StatusNotification>
            ⚠️ No runnable TES instances found. Task submission needs an instance that is healthy, reachable, and does not require authorization.
            <Button type="button" variant="demo" onClick={refreshInstances} style={{marginLeft: '10px', padding: '5px 10px'}}>
              <RefreshCw size={14} style={{ marginRight: '5px' }} />
              Refresh Instances
            </Button>
          </StatusNotification>
        )}
        
        <FormGroup>
          <Label htmlFor="tes_instance">TES Instance *</Label>
          <Select
            id="tes_instance"
            name="tes_instance"
            value={selectedInstanceUrl}
            onChange={(e) => setSelectedInstanceUrl(e.target.value)}
            required
          >
            <option value="">Select TES Instance</option>
            {instanceOptions
              .slice()
              .sort((a, b) => {
                if (isRunnableInstance(a) && !isRunnableInstance(b)) return -1;
                if (!isRunnableInstance(a) && isRunnableInstance(b)) return 1;
                if (requiresAuthorization(a) && !requiresAuthorization(b)) return 1;
                if (!requiresAuthorization(a) && requiresAuthorization(b)) return -1;
                if (isReachableInstance(a) && !isReachableInstance(b)) return -1;
                if (!isReachableInstance(a) && isReachableInstance(b)) return 1;
                return 0;
              })
              .map((instance) => (
                <option 
                  key={instance.url} 
                  value={instance.url}
                  disabled={!isRunnableInstance(instance)}
                >
                  {getInstanceCapabilitySymbol(instance)} {instance.name} ({getInstanceCapabilityLabel(instance)})
                </option>
              ))}
          </Select>
          <HelpText>
            ✅ ready: healthy, reachable, and runnable without authorization. 🔒 auth required: reachable but task submission will fail without credentials. ⚠️ not runnable: reachable, but task submission is unavailable. ❌ unreachable: service-info could not be reached.
          </HelpText>
        </FormGroup>
        
        {tesBaseUrl ? (
          <CreateRunContainer>
            <ECCClientGa4ghTesCreateRun key={tesBaseUrl} baseURL={tesBaseUrl} />
          </CreateRunContainer>
        ) : (
          <StatusNotification>
            Please select a runnable TES instance above to configure and submit a task.
          </StatusNotification>
        )}
      </FormCard>
    </PageContainer>
  );
};

export default SubmitTask;
