import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import dashboardReducer from '../views/dashboard/slices/dashboardSlice';
import { persistMiddleware } from './middleware/persistMiddleware';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    dashboard: dashboardReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false
    }).concat(persistMiddleware),
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;
