import { createSlice } from '@reduxjs/toolkit';

const loadInitialState = () => {
  try {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser && typeof parsedUser === 'object' && Object.keys(parsedUser).length > 0) {
        return {
          user: parsedUser,
          token: storedToken,
          isAuthenticated: true
        };
      }
    }
  } catch (error) {
    console.error('Error loading initial state:', error);
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    loginSuccess: (state, action) => {
      const { user, token } = action.payload;
      if (user && Object.keys(user).length > 0) {
        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    }
  }
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
