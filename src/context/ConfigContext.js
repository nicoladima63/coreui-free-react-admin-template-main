import React, { createContext, useContext } from 'react';
import { getCurrentConfig } from '../config/environment';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  // Recupera la configurazione corrente
  const config = getCurrentConfig();

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

//come usarlo in app.js o index.js
//import React from 'react';
//import { ConfigProvider } from './context/ConfigContext';

//const App = () => (
//  <ConfigProvider>
//    {/* Altre parti della tua app */}
//  </ConfigProvider>
//);

//export default App;


//in una pagina qualsiasi
//import { useConfig } from '../context/ConfigContext';

//const MyComponent = () => {
//  const { apiBaseUrl, wsUrl } = useConfig();

//  const updatePassword = async (formData) => {
//    await axios.put(`${apiBaseUrl}/users/update-password`, {
//      email: formData.email,
//      password: formData.newPassword,
//    });
//  };

//  return <div> cicciobello</div>;
//};
