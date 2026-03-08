// Utility for fetching network topology for workflow visualization
import { apiClient } from './api';

export const topologyService = {
  getNetworkTopology: async () => {
    const response = await apiClient.get('/api/network_topology');
    return response.data;
  }
};
