import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedFilter: 'incomplete',
  modalState: {
    addVisible: false,
    stepsVisible: false,
    selectedTask: null
  }
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedFilter: (state, action) => {
      state.selectedFilter = action.payload;
    },
    setModalState: (state, action) => {
      state.modalState = { ...state.modalState, ...action.payload };
    },
    resetModalState: (state) => {
      state.modalState = initialState.modalState;
    }
  }
});

export const { setSelectedFilter, setModalState, resetModalState } = dashboardSlice.actions;
export default dashboardSlice.reducer;
