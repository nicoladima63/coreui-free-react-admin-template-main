import { legacy_createStore as createStore } from 'redux';

const loadInitialState = () => {
  try {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      // Assicuriamoci che l'oggetto user sia valido
      if (parsedUser && typeof parsedUser === 'object' && Object.keys(parsedUser).length > 0) {
        return {
          user: parsedUser,
          token: storedToken,
          isAuthenticated: true
        };
      }
    }
  } catch (error) {
    console.error('Errore nel caricamento dello stato iniziale:', error);
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false
  };
};

const initialState = {
  sidebarShow: true,
  theme: 'light',
  auth: loadInitialState()
};

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest };

    case 'LOGIN_SUCCESS':
      // Se abbiamo già uno stato di autenticazione valido, non facciamo nulla
      if (state.auth.isAuthenticated && state.auth.user && Object.keys(state.auth.user).length > 0) {
        return state;
      }

      // Verifica che user sia presente e non sia un oggetto vuoto
      if (!rest.user || Object.keys(rest.user).length === 0) {
        // Proviamo a caricare i dati dal localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && Object.keys(parsedUser).length > 0) {
              return {
                ...state,
                auth: {
                  user: parsedUser,
                  token: storedToken,
                  isAuthenticated: true
                }
              };
            }
          } catch (error) {
            console.error('Errore nel parsing dei dati dal localStorage:', error);
          }
        }
        return state;
      }

      const newAuthState = {
        ...state,
        auth: {
          user: rest.user,
          token: rest.token || localStorage.getItem('token'),
          isAuthenticated: true
        }
      };

      // Salva nel localStorage solo se i dati sono diversi
      const currentStoredUser = localStorage.getItem('user');
      if (currentStoredUser !== JSON.stringify(rest.user)) {
        localStorage.setItem('user', JSON.stringify(rest.user));
      }

      if (rest.token && localStorage.getItem('token') !== rest.token) {
        localStorage.setItem('token', rest.token);
      }

      return newAuthState;

    case 'LOGOUT':
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return {
        ...state,
        auth: {
          user: null,
          token: null,
          isAuthenticated: false
        }
      };

    default:
      return state;
  }
};

const store = createStore(changeState);

// Debug helper
//store.subscribe(() => {
//  const state = store.getState();
//  if (process.env.NODE_ENV === 'development') {
//    console.log('Redux State Updated:', state.auth);
//    console.log('LocalStorage user:', localStorage.getItem('user'));
//    console.log('LocalStorage token:', localStorage.getItem('token'));
//  }
//});

export default store;
