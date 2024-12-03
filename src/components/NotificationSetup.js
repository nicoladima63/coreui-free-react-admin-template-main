// src/components/NotificationSetup.js
import { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationSetup = () => {
  const {
    supported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    registerServiceWorker
  } = useNotifications();

  useEffect(() => {
    if (supported && permission === 'default') {
      requestPermission();
    }
  }, [supported, permission, requestPermission]);

  if (!supported) {
    return null;
  }

  return (
    <div>
      {!subscription && permission === 'granted' && (
        <button onClick={subscribe}>
          Attiva notifiche push
        </button>
      )}
    </div>
  );
};

export default NotificationSetup;
