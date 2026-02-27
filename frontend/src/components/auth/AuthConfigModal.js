import React, { useState } from 'react';
import styled from 'styled-components';
import { Shield, Key, User, AlertTriangle, Save, X } from 'lucide-react';
import { useAuthConfig } from '../../contexts/AuthConfigContext';
import useInstances from '../../hooks/useInstances';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 6px;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const Warning = styled.div`
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.75rem;
  color: #92400e;
  font-size: 0.875rem;
`;

const InstanceSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const InstanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const InstanceName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
`;

const InstanceUrl = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-family: monospace;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
`;

const AuthTypeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const AuthTypeButton = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$active ? '#2563eb' : '#d1d5db'};
  background: ${props => props.$active ? '#eff6ff' : 'white'};
  color: ${props => props.$active ? '#2563eb' : '#374151'};
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #2563eb;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: monospace;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => props.$configured ? '#d1fae5' : '#fee2e2'};
  color: ${props => props.$configured ? '#065f46' : '#991b1b'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: none;
  
  ${props => props.$variant === 'primary' ? `
    background: #2563eb;
    color: white;
    
    &:hover {
      background: #1d4ed8;
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  `}
`;

const AuthConfigModal = ({ isOpen, onClose }) => {
  const { instances } = useInstances();
  const { tesCredentials, setInstanceCredentials, hasCredentials } = useAuthConfig();
  
  const [instanceConfigs, setInstanceConfigs] = useState(() => {
    const configs = {};
    instances.forEach(inst => {
      const existing = tesCredentials[inst.url] || {};
      configs[inst.url] = {
        authType: existing.token ? 'token' : 'basic',
        token: existing.token || '',
        username: existing.username || '',
        password: existing.password || ''
      };
    });
    return configs;
  });

  if (!isOpen) return null;

  const handleAuthTypeChange = (instanceUrl, authType) => {
    setInstanceConfigs(prev => ({
      ...prev,
      [instanceUrl]: {
        ...prev[instanceUrl],
        authType
      }
    }));
  };

  const handleInputChange = (instanceUrl, field, value) => {
    setInstanceConfigs(prev => ({
      ...prev,
      [instanceUrl]: {
        ...prev[instanceUrl],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    // Save all configurations
    Object.entries(instanceConfigs).forEach(([url, config]) => {
      if (config.authType === 'token' && config.token) {
        setInstanceCredentials(url, { token: config.token });
      } else if (config.authType === 'basic' && config.username && config.password) {
        setInstanceCredentials(url, { 
          username: config.username, 
          password: config.password 
        });
      }
    });
    onClose();
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            <Shield size={24} />
            TES Authentication Configuration
          </Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Warning>
          <AlertTriangle size={20} />
          <div>
            <strong>Temporary Solution:</strong> Credentials are stored in session storage only and will be cleared 
            when you close your browser. Life Science Login integration is coming soon.
          </div>
        </Warning>

        {instances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No TES instances available. Please check your configuration.
          </div>
        ) : (
          instances.map((instance) => {
            const config = instanceConfigs[instance.url] || { authType: 'token', token: '', username: '', password: '' };
            const configured = hasCredentials(instance.url);
            
            return (
              <InstanceSection key={instance.url}>
                <InstanceHeader>
                  <div>
                    <InstanceName>{instance.name}</InstanceName>
                    <StatusBadge $configured={configured}>
                      {configured ? '✓ Configured' : '⚠ Not Configured'}
                    </StatusBadge>
                  </div>
                </InstanceHeader>
                
                <InstanceUrl>{instance.url}</InstanceUrl>

                <AuthTypeSelector>
                  <AuthTypeButton
                    type="button"
                    $active={config.authType === 'token'}
                    onClick={() => handleAuthTypeChange(instance.url, 'token')}
                  >
                    <Key size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    JWT Token
                  </AuthTypeButton>
                  <AuthTypeButton
                    type="button"
                    $active={config.authType === 'basic'}
                    onClick={() => handleAuthTypeChange(instance.url, 'basic')}
                  >
                    <User size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Basic Auth
                  </AuthTypeButton>
                </AuthTypeSelector>

                {config.authType === 'token' ? (
                  <FormGroup>
                    <Label>JWT Token</Label>
                    <TextArea
                      value={config.token}
                      onChange={(e) => handleInputChange(instance.url, 'token', e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                  </FormGroup>
                ) : (
                  <>
                    <FormGroup>
                      <Label>Username</Label>
                      <Input
                        type="text"
                        value={config.username}
                        onChange={(e) => handleInputChange(instance.url, 'username', e.target.value)}
                        placeholder="username"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={config.password}
                        onChange={(e) => handleInputChange(instance.url, 'password', e.target.value)}
                        placeholder="••••••••"
                      />
                    </FormGroup>
                  </>
                )}
              </InstanceSection>
            );
          })
        )}

        <ButtonGroup>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" $variant="primary" onClick={handleSave}>
            <Save size={16} />
            Save Configuration
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
};

export default AuthConfigModal;
