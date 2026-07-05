import { apiClient } from './api';

export const serviceInfoService = {
  getTesInstances: async () => {
    try {
      const response = await apiClient.get('/api/dashboard_data');
      const tesInstances = response.data.tes_instances || [];
      return tesInstances.map(instance => ({
        name: instance.name,
        url: instance.url,
        id: instance.url.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      }));
    } catch (error) {
      console.error('Error fetching TES instances:', error);
      throw error;
    }
  },

  getHealthyInstances: async () => {
    try {
      const response = await apiClient.get('/api/healthy-instances');
      return response.data;
    } catch (error) {
      console.error('Error fetching healthy instances:', error);
      return { instances: [], count: 0 };
    }
  },

  getServiceInfo: async (tesUrl) => {
    try {
      console.log('Fetching service info for:', tesUrl);
      
      const response = await apiClient.get('/api/service_info', {
        params: { tes_url: tesUrl }
      });
      
      console.log('Got service info response:', response.data);
      
      if (response.data.error) {
        console.warn('Service info returned with error flag:', response.data.error_message || response.data.description);
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error fetching service info:', error);
      
      // Fallback for network errors or other exceptions
      const getInstanceName = async () => {
        try {
          const dashboardResponse = await apiClient.get('/api/dashboard_data');
          const tesInstances = dashboardResponse.data.tes_instances || [];
          const instanceInfo = tesInstances.find(instance => instance.url === tesUrl);
          return instanceInfo?.name || tesUrl;
        } catch {
          return tesUrl;
        }
      };
      
      const instanceName = await getInstanceName();
      let errorMessage = 'Unable to retrieve service information.';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'The TES instance did not respond within the expected time.';
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage = 'Unable to connect to the TES instance.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || error.message;
      }
      
      return {
        name: instanceName,
        id: tesUrl,
        organization: {
          name: 'GA4GH TES',
          url: tesUrl
        },
        description: errorMessage,
        type: {
          group: 'ga4gh',
          artifact: 'tes',
          version: '1.0'
        },
        contactUrl: 'Unknown',
        documentationUrl: 'Unknown',
        createdAt: 'Unknown',
        storage: ['Unknown'],
        environment: 'Unknown',
        version: '1.0',
        error: true,
        errorMessage: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }
};
