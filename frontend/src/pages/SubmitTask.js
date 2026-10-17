import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import useInstances from '../hooks/useInstances';
import { ArrowLeft, RefreshCw, Lock, Key, Check, Eye, EyeOff } from 'lucide-react';
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
  background: ${props => props.variant === 'info' ? '#eff6ff' : '#fff3cd'};
  border: 1px solid ${props => props.variant === 'info' ? '#bfdbfe' : '#ffeaa7'};
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
  color: ${props => props.variant === 'info' ? '#1e40af' : '#856404'};
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

const AuthCard = styled.div`
  background: #fdfbf7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 24px;
`;

const AuthHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const AuthTitle = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AuthBadge = styled.span`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  background: ${props => props.variant === 'ready' ? '#dcfce7' : '#fef3c7'};
  color: ${props => props.variant === 'ready' ? '#166534' : '#92400e'};
  border: 1px solid ${props => props.variant === 'ready' ? '#bbf7d0' : '#fde68a'};
`;

const AuthDescription = styled.p`
  margin: 0 0 14px 0;
  font-size: 13px;
  color: #78350f;
  line-height: 1.4;
`;

const AuthTabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
`;

const AuthTab = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  background: ${props => props.active === "true" ? '#007bff' : '#f1f5f9'};
  color: ${props => props.active === "true" ? '#ffffff' : '#475569'};
  border: 1px solid ${props => props.active === "true" ? '#007bff' : '#cbd5e1'};
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active === "true" ? '#0069d9' : '#e2e8f0'};
  }
`;

const AuthInput = styled.input`
  width: 90%;
  padding: 10px 12px;
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

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const IconButton = styled.button`
  position: absolute;
  right: 25px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  display: flex;
  align-items: center;
  padding: 4px;

  &:hover {
    color: #333;
  }
`;

const RememberCheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
  margin-top: 10px;

  input {
    cursor: pointer;
  }

  label {
    cursor: pointer;
  }
`;

const SubmitTask = () => {
  const navigate = useNavigate();
  const [selectedInstanceUrl, setSelectedInstanceUrl] = useState('');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('tesToken') || '');
  const [authUsername, setAuthUsername] = useState(() => localStorage.getItem('tesUsername') || '');
  const [authPassword, setAuthPassword] = useState(() => localStorage.getItem('tesPassword') || '');
  const [authType, setAuthType] = useState('token');
  const [rememberAuth, setRememberAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

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

  const hasAuthForInstance = (instance) => {
    if (!requiresAuthorization(instance)) return true;
    return Boolean(authToken?.trim() || (authUsername?.trim() && authPassword?.trim()));
  };

  const isRunnableInstance = (instance) => {
    if (!isReachableInstance(instance) || instance?.task_submission_available === false) {
      return false;
    }
    if (requiresAuthorization(instance)) {
      return hasAuthForInstance(instance);
    }
    return true;
  };

  const getInstanceCapabilitySymbol = (instance) => {
    if (!isReachableInstance(instance)) {
      return '❌';
    }

    if (requiresAuthorization(instance)) {
      return hasAuthForInstance(instance) ? '🔐' : '🔒';
    }

    if (instance?.task_submission_available === true) {
      return '✅';
    }

    return '⚠️';
  };

  const getInstanceCapabilityLabel = (instance) => {
    if (!isReachableInstance(instance)) {
      return 'not ready: unreachable';
    }

    if (requiresAuthorization(instance)) {
      return hasAuthForInstance(instance) ? 'ready: auth configured' : 'auth required';
    }

    if (instance?.task_submission_available === true) {
      return 'ready: public';
    }

    return 'not ready: unavailable';
  };

  const hasUsableUrl = (instance) => {
    return typeof instance?.url === 'string' && instance.url.trim() !== '';
  };

  const instanceOptions = (allInstances.length > 0 ? allInstances : instances).filter(hasUsableUrl);
  const selectedInstance = instanceOptions.find(instance => instance.url === selectedInstanceUrl);
  const hasInvalidSelectedInstance = Boolean(selectedInstanceUrl) && selectedInstance && !isReachableInstance(selectedInstance);

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

  const handleTokenChange = (value) => {
    setAuthToken(value);
    if (rememberAuth) {
      if (value) {
        localStorage.setItem('tesToken', value);
      } else {
        localStorage.removeItem('tesToken');
      }
    }
  };

  const handleUsernameChange = (value) => {
    setAuthUsername(value);
    if (rememberAuth) {
      if (value) {
        localStorage.setItem('tesUsername', value);
      } else {
        localStorage.removeItem('tesUsername');
      }
    }
  };

  const handlePasswordChange = (value) => {
    setAuthPassword(value);
    if (rememberAuth) {
      if (value) {
        localStorage.setItem('tesPassword', value);
      } else {
        localStorage.removeItem('tesPassword');
      }
    }
  };

  // Intercept fetch requests made by ECCClientGa4ghTesCreateRun to attach Authorization header for auth-required instances
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      try {
        const requestUrl = typeof input === 'string' ? input : input?.url || '';

        const isTesRequest = tesBaseUrl && (
          requestUrl.startsWith(tesBaseUrl) ||
          (requestUrl.includes('/tasks') &&
            requestUrl.includes(new URL(tesBaseUrl, window.location.origin).hostname))
        );

        if (isTesRequest && requiresAuthorization(selectedInstance)) {
          let authHeader = '';
          if (authType === 'token' && authToken?.trim()) {
            const token = authToken.trim();
            authHeader = token.startsWith('Bearer ') || token.startsWith('Basic ')
              ? token
              : `Bearer ${token}`;
          } else if (authType === 'basic' && authUsername && authPassword) {
            authHeader = `Basic ${btoa(`${authUsername}:${authPassword}`)}`;
          } else if (authToken?.trim()) {
            const token = authToken.trim();
            authHeader = token.startsWith('Bearer ') || token.startsWith('Basic ')
              ? token
              : `Bearer ${token}`;
          }

          if (authHeader) {
            const existingHeaders = init?.headers || (typeof input !== 'string' && input.headers ? input.headers : {}) || {};
            const newHeaders = new Headers(existingHeaders);
            newHeaders.set('Authorization', authHeader);

            if (typeof input === 'string') {
              return originalFetch(input, {
                ...init,
                headers: newHeaders
              });
            } else {
              try {
                const newRequest = new Request(input, {
                  ...init,
                  headers: newHeaders
                });
                return originalFetch(newRequest);
              } catch (e) {
                return originalFetch(input, init);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error applying auth header to fetch request:', err);
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [tesBaseUrl, selectedInstance, authType, authToken, authUsername, authPassword]);

  useEffect(() => {
    // Auto-select the first runnable instance (prefer public, then auth-configured)
    const runnableInstance = instanceOptions.find(
      instance => isReachableInstance(instance) && !requiresAuthorization(instance)
    ) || instanceOptions.find(isReachableInstance);

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
            The selected TES instance is unreachable. Please select a healthy instance.
          </StatusNotification>
        )}
        
        {instanceOptions.filter(isReachableInstance).length === 0 && !instancesLoading && (
          <StatusNotification>
            No reachable TES instances found.
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
                const aRunnable = isRunnableInstance(a);
                const bRunnable = isRunnableInstance(b);
                if (aRunnable && !bRunnable) return -1;
                if (!aRunnable && bRunnable) return 1;

                const aAuth = requiresAuthorization(a) && isReachableInstance(a);
                const bAuth = requiresAuthorization(b) && isReachableInstance(b);
                if (aAuth && !bAuth) return -1;
                if (!aAuth && bAuth) return 1;

                const aReachable = isReachableInstance(a);
                const bReachable = isReachableInstance(b);
                if (aReachable && !bReachable) return -1;
                if (!aReachable && bReachable) return 1;

                return 0;
              })
              .map((instance) => (
                <option 
                  key={instance.url} 
                  value={instance.url}
                  disabled={!isReachableInstance(instance)}
                >
                  {getInstanceCapabilitySymbol(instance)} {instance.name} ({getInstanceCapabilityLabel(instance)})
                </option>
              ))}
          </Select>
          <HelpText>
            ✅ ready: public and runnable without authorization. 🔒 auth required: credentials needed (enter token below). 🔐 auth configured: credentials provided. ⚠️ unavailable: task submission unavailable. ❌ unreachable: instance offline.
          </HelpText>
        </FormGroup>

        {selectedInstance && requiresAuthorization(selectedInstance) && (
          <AuthCard>
            <AuthHeader>
              <AuthTitle>
                <Lock size={18} style={{ color: '#d97706' }} />
                Authentication Credentials
              </AuthTitle>
              {hasAuthForInstance(selectedInstance) ? (
                <AuthBadge variant="ready">
                  <Check size={12} style={{ marginRight: '4px' }} />
                  Auth Configured
                </AuthBadge>
              ) : (
                <AuthBadge variant="required">
                  Credentials Needed
                </AuthBadge>
              )}
            </AuthHeader>

            <AuthDescription>
              <strong>{selectedInstance.name}</strong> requires authentication. Provide a Bearer token or credentials below to authenticate task submissions.
            </AuthDescription>

            <AuthTabContainer>
              <AuthTab 
                type="button" 
                active={(authType === 'token').toString()} 
                onClick={() => setAuthType('token')}
              >
                <Key size={14} style={{ marginRight: '6px' }} />
                Bearer Token
              </AuthTab>
              <AuthTab 
                type="button" 
                active={(authType === 'basic').toString()} 
                onClick={() => setAuthType('basic')}
              >
                <Lock size={14} style={{ marginRight: '6px' }} />
                Basic Auth
              </AuthTab>
            </AuthTabContainer>

            {authType === 'token' ? (
              <FormGroup style={{ marginBottom: '10px' }}>
                <Label htmlFor="auth_token">
                  Bearer Token / API Key *
                </Label>
                <PasswordInputWrapper>
                  <AuthInput
                    id="auth_token"
                    type={showPassword ? 'text' : 'password'}
                    value={authToken}
                    onChange={(e) => handleTokenChange(e.target.value)}
                    placeholder="Enter Bearer Token (e.g. eyJhbGciOi... or API token)"
                  />
                  <IconButton
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    title={showPassword ? 'Hide token' : 'Show token'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </IconButton>
                </PasswordInputWrapper>
                <HelpText>
                  Token will be sent as an <code>Authorization: Bearer &lt;token&gt;</code> header with your task submission.
                </HelpText>
              </FormGroup>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <FormGroup style={{ marginBottom: 0 }}>
                  <Label htmlFor="auth_username">Username *</Label>
                  <AuthInput
                    id="auth_username"
                    type="text"
                    value={authUsername}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Username"
                  />
                </FormGroup>
                <FormGroup style={{ marginBottom: 0 }}>
                  <Label htmlFor="auth_password">Password *</Label>
                  <PasswordInputWrapper>
                    <AuthInput
                      id="auth_password"
                      type={showPassword ? 'text' : 'password'}
                      value={authPassword}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Password"
                    />
                    <IconButton
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </PasswordInputWrapper>
                </FormGroup>
              </div>
            )}

            <RememberCheckboxGroup>
              <input
                type="checkbox"
                id="remember_auth"
                checked={rememberAuth}
                onChange={(e) => setRememberAuth(e.target.checked)}
              />
              <label htmlFor="remember_auth">
                Save credentials in Dashboard Settings for future submissions
              </label>
            </RememberCheckboxGroup>
          </AuthCard>
        )}
        
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
