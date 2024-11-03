// constants/errorMessages.js
export const API_ERROR_MESSAGES = {
  GENERIC_ERROR: 'Si è verificato un errore. Riprova più tardi.',
  NETWORK_ERROR: 'Errore di connessione. Verifica la tua connessione internet.',
  NOT_FOUND: 'Risorsa non trovata.',
  UNAUTHORIZED: 'Sessione scaduta. Effettua nuovamente il login.',
  FORBIDDEN: 'Non hai i permessi necessari per questa operazione.',
  VALIDATION_ERROR: 'Dati non validi. Verifica i campi inseriti.',
  SERVER_ERROR: 'Errore del server. Riprova più tardi.',
};

export const getErrorMessage = (error) => {
  switch (error.code) {
    case 401:
      return API_ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return API_ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return API_ERROR_MESSAGES.NOT_FOUND;
    case 422:
      return API_ERROR_MESSAGES.VALIDATION_ERROR;
    case 500:
      return API_ERROR_MESSAGES.SERVER_ERROR;
    default:
      return error.message || API_ERROR_MESSAGES.GENERIC_ERROR;
  }
};
