import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ToastContainer } from 'react-toastify'
import { WorksProvider } from './context/WorksContext'
import { WebSocketProvider } from './context/WebSocketContext';
import './scss/style.scss'
import 'react-toastify/dist/ReactToastify.css'

// Configurazione di React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
})

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))
const WebSocketTest = React.lazy(() => import('./views/test/WebSocketTest'))
const SendMessageToPC = React.lazy(() => import('./views/test/SendMessageToPC'))
// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="pt-3 text-center">
    <CSpinner color="primary" variant="grow" />
  </div>
)

const AppRoutes = () => (
  <Routes>
    <Route exact path="/login" name="Login Page" element={<Login />} />
    <Route exact path="/register" name="Register Page" element={<Register />} />
    <Route exact path="/404" name="Page 404" element={<Page404 />} />
    <Route exact path="/500" name="Page 500" element={<Page500 />} />
    <Route path="/test-websocket" element={<WebSocketTest />} />
    <Route path="/SendMessageToPC" element={<SendMessageToPC />} />
    {/* Rotta predefinita */}
    <Route path="*" name="Home" element={<DefaultLayout />} />
  </Routes>
)

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]

    if (theme) {
      setColorMode(theme)
    }
    if (isColorModeSet()) {
      return
    }
    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <WorksProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <AppRoutes />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </Suspense>
          </WorksProvider>
        </WebSocketProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </HashRouter>
  )
}

export default App
