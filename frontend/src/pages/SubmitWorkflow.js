import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { workflowService } from '../services/workflowService';
import { testConnection } from '../services/api';
import useInstances from '../hooks/useInstances';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { ArrowLeft, Play, RefreshCw } from 'lucide-react';

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
  &:hover { background: #5a6268; }
`;

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  margin: 0 0 30px 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
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
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  transition: all 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 30px;
`;

const ButtonIcon = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  background: ${props => props.variant === 'primary' ? '#3182ce' : '#64748b'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  &:hover:not(:disabled) {
    background: ${props => props.variant === 'primary' ? '#2c5282' : '#475569'};
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EXAMPLE_SNAKEFILE = `# Example Snakemake Workflow\nrule all:\n    input:\n        "results/summary.txt"\nrule step1:\n    output:\n        "results/step1.txt"\n    shell:\n        """\n        echo 'Step 1' > {output}\n        """\nrule step2:\n    input:\n        "results/step1.txt"\n    output:\n        "results/summary.txt"\n    shell:\n        """\n        echo 'Step 2' > {output}\n        cat {input} >> {output}\n        """`;

const SubmitWorkflow = () => {
  const navigate = useNavigate();
  const { instances, loading: instancesLoading } = useInstances();
  const [snakefile, setSnakefile] = useState("");
  const [selectedInstance, setSelectedInstance] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);

  const handleExample = () => {
    setSnakefile(EXAMPLE_SNAKEFILE);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError('');
    try {
      const result = await testConnection();
      setSuccess(`Connection Test SUCCESS: ${result.message} (${result.timestamp})`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Connection test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const snakefileBlob = new Blob([snakefile], { type: 'text/plain' });
      const snakefileFile = new File([snakefileBlob], 'Snakefile', { type: 'text/plain' });
      const workflowData = {
        wf_type: 'snakemake',
        wf_tes_instance: selectedInstance,
        wf_distribution_logic: 'round-robin',
        snakefile: snakefileFile
      };
      await workflowService.submitWorkflow(workflowData);
      navigate('/workflows');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit workflow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <BackButton onClick={() => navigate('/workflows')}>
        <ArrowLeft size={18} style={{ marginRight: 8 }} />
        Back to Workflows
      </BackButton>
      <FormCard>
        <Title>Submit Workflow</Title>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Target TES Instance(s)</Label>
            <Select
              value={selectedInstance}
              onChange={e => setSelectedInstance(e.target.value)}
              disabled={instancesLoading}
            >
              <option value="all">All Healthy Instances ({instances.length} available)</option>
              {instances.map((instance, idx) => (
                <option key={idx} value={instance.url}>
                  {instance.name} - {instance.url}
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Workflow (Snakefile)</Label>
            <TextArea
              value={snakefile}
              onChange={e => setSnakefile(e.target.value)}
              rows={10}
            />
            <Button type="button" style={{ marginTop: 10 }} onClick={handleExample}>
              Fill with Example
            </Button>
          </FormGroup>
          {error && <ErrorMessage message={error} />}
          {success && <div style={{ color: '#10b981', marginBottom: 10 }}>{success}</div>}
          <ButtonGroup>
            <Button type="button" onClick={handleTestConnection} disabled={testingConnection}>
              {testingConnection ? 'Testing...' : <><ButtonIcon><RefreshCw size={16} /></ButtonIcon>Test Connections</>}
            </Button>
            <Button type="submit" variant="primary" disabled={loading || instancesLoading}>
              {loading ? 'Submitting...' : <><ButtonIcon><Play size={16} /></ButtonIcon>Submit Workflow</>}
            </Button>
            <Button type="button" onClick={() => navigate('/workflows')}>
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </FormCard>
    </PageContainer>
  );
};

export default SubmitWorkflow;
