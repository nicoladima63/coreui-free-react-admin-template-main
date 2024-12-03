// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from './useToast';
import { cilBell, cilBellExclamation } from '@coreui/icons';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const { showSuccess, showError } = useToast();
  const auth = useSelector(state => state.auth);

  // Verifica supporto browser
  const supported = useCallback(() => {
    const requirements = [
      'Notification' in window,
      'serviceWorker' in navigator,
      'PushManager' in window
    ];

    return requirements.every(Boolean);
  }, []);

  // Registra service worker con retry
  const registerServiceWorker = useCallback(async (retries = 3) => {
    let attempt = 0;

    while (attempt < retries) {
      try {
        setIsRegistering(true);
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });

        // Attendi che il service worker sia attivo
        await navigator.serviceWorker.ready;

        setRegistrationError(null);
        return registration;
      } catch (error) {
        console.error(`Registration attempt ${attempt + 1} failed:`, error);
        attempt++;

        if (attempt === retries) {
          setRegistrationError(error);
          showError('Impossibile attivare le notifiche. Riprova più tardi.');
          throw error;
        }

        // Attendi prima del retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } finally {
        setIsRegistering(false);
      }
    }
  }, [showError]);

  // Richiedi permesso con UI migliorata
  const requestPermission = useCallback(async () => {
    try {
      if (!supported()) {
        showError('Il tuo browser non supporta le notifiche push');
        return 'denied';
      }

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        showSuccess('Permesso notifiche accordato!');
      } else if (result === 'denied') {
        showError('Permesso notifiche negato. Cambia le impostazioni del browser per ricevere notifiche.');
      }

      return result;
    } catch (error) {
      console.error('Permission request failed:', error);
      showError('Errore durante la richiesta dei permessi');
      return 'denied';
    }
  }, [supported, showSuccess, showError]);

  // Sottoscrizione con gestione token
  const subscribe = useCallback(async () => {
    if (!auth?.user?.id) {
      showError('Devi essere autenticato per attivare le notifiche');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Ottieni la chiave pubblica VAPID
      const response = await fetch('/api/push/vapid-public-key', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) throw new Error('Impossibile ottenere la chiave pubblica');

      const { publicKey } = await response.json();

      // Crea subscription
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Cambia da userVisibility a userVisibleOnly
        applicationServerKey: publicKey
      });

      // Salva sul server
      const saveResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ subscription: pushSubscription })
      });

      if (!saveResponse.ok) throw new Error('Impossibile salvare la subscription');

      setSubscription(pushSubscription);
      showSuccess('Notifiche attivate con successo', {
        icon: cilBell
      });

      return pushSubscription;
    } catch (error) {
      console.error('Subscription failed:', error);
      showError('Impossibile attivare le notifiche: ' + error.message, {
        icon: cilBellExclamation
      });
      return null;
    }
  }, [auth, showSuccess, showError]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notifica il server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        setSubscription(null);
        showSuccess('Notifiche disattivate');
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      showError('Impossibile disattivare le notifiche');
    }
  }, [auth, showSuccess, showError]);

  // Inizializzazione
  useEffect(() => {
    if (!supported() || !auth?.user?.id) return;

    const init = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
          setSubscription(existingSubscription);
        }

        setPermission(Notification.permission);
      } catch (error) {
        console.error('Initialization failed:', error);
        setRegistrationError(error);
      }
    };

    init();
  }, [supported, auth?.user?.id]);

  return {
    supported: supported(),
    permission,
    subscription,
    isRegistering,
    registrationError,
    requestPermission,
    subscribe,
    unsubscribe,
    registerServiceWorker
  };
};
