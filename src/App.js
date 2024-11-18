import React, { Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CSpinner, useColorModes } from '@coreui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import { WorksProvider } from './context/WorksContext';
import { WebSocketProvider } from './context/WebSocketContext';
import './scss/style.scss';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

// Configurazione di React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
});

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'));

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'));
const Logout = React.lazy(() => import('./views/pages/login/Logout'));
const Register = React.lazy(() => import('./views/pages/register/Register'));
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'));
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'));
const WebSocketTest = React.lazy(() => import('./views/test/WebSocketTest'));
const SendMessageToPC = React.lazy(() => import('./views/test/SendMessageToPC'));
const TodoMessage = React.lazy(() => import('./views/todo/TodoMessages'));

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="pt-3 text-center">
    <CSpinner color="primary" variant="grow" />
  </div>
);

const AppRoutes = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        user: {/* carica i dettagli dell'utente qui, se disponibili */ }
      });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // Se il token non esiste, reindirizza alla pagina di login
      navigate('/login');
    }
  }, [dispatch, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/register" element={<Register />} />
      <Route path="/404" element={<Page404 />} />
      <Route path="/500" element={<Page500 />} />
      <Route path="/test-websocket" element={<WebSocketTest />} />
      <Route path="/SendMessageToPC" element={<SendMessageToPC />} />
      <Route path="/todo" element={<TodoMessage />} />
      {/* Rotta predefinita */}
      <Route path="*" element={<DefaultLayout />} />
    </Routes>
  );
};

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');
  const storedTheme = useSelector((state) => state.theme);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0];

    if (theme) {
      setColorMode(theme);
    }
    if (isColorModeSet()) {
      return;
    }
    setColorMode(storedTheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <AppRoutes />
            <ToastContainer
              position="top"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick={true}
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </Suspense>
        </WebSocketProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </HashRouter>
  );
};

export default App;
