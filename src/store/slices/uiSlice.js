import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarShow: true,
    unfoldable: false,
    theme: 'light'
  },
  reducers: {
    setSidebarShow: (state, action) => {
      state.sidebarShow = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setUiState: (state, action) => {
      return { ...state, ...action.payload };
    },
    setUnfoldable: (state, action) => {
      state.unfoldable = action.payload;
    }
  }
});

export const { setSidebarShow, setTheme, setUiState,setUnfoldable } = uiSlice.actions;
export default uiSlice.reducer;
