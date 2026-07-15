import { useState, useEffect } from 'react';
import instanceService from '../services/instanceService';

const useInstances = () => {
  const [state, setState] = useState(() => instanceService.getState());

  useEffect(() => {
    const handleUpdate = (newState) => {
      setState(newState);
    };
    instanceService.addListener(handleUpdate);
    setState(instanceService.getState());
    return () => {
      instanceService.removeListener(handleUpdate);
    };
  }, []);
  const refresh = () => {
    instanceService.refresh();
  };

  return {
    instances: state.instances,
    allInstances: state.allInstances,
    loading: state.loading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    refresh,
    hasInstances: state.instances.length > 0
  };
};

export default useInstances;
