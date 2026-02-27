import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthConfigContext = createContext();

export const useAuthConfig = () => {
  const context = useContext(AuthConfigContext);
  if (!context) {
    throw new Error('useAuthConfig must be used within AuthConfigProvider');
  }
  return context;
};

export const AuthConfigProvider = ({ children }) => {
  const [tesCredentials, setTesCredentials] = useState(() => {
    // Try to load from sessionStorage (not localStorage for security)
    const saved = sessionStorage.getItem('tesCredentials');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    // Save to sessionStorage whenever credentials change
    sessionStorage.setItem('tesCredentials', JSON.stringify(tesCredentials));
  }, [tesCredentials]);

  const setInstanceCredentials = (instanceUrl, credentials) => {
    setTesCredentials(prev => ({
      ...prev,
      [instanceUrl]: credentials
    }));
  };

  const getInstanceCredentials = (instanceUrl) => {
    return tesCredentials[instanceUrl] || null;
  };

  const clearAllCredentials = () => {
    setTesCredentials({});
    sessionStorage.removeItem('tesCredentials');
  };

  const hasCredentials = (instanceUrl) => {
    const creds = tesCredentials[instanceUrl];
    return creds && (creds.token || (creds.username && creds.password));
  };

  return (
    <AuthConfigContext.Provider
      value={{
        tesCredentials,
        setInstanceCredentials,
        getInstanceCredentials,
        clearAllCredentials,
        hasCredentials
      }}
    >
      {children}
    </AuthConfigContext.Provider>
  );
};
