import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RaveState } from '../types';

const initialState: RaveState = {
  currentClipUri: null,
  transformedUri: null,
  isCalculating: false,
};

const raveSlice = createSlice({
  name: 'rave',
  initialState,
  reducers: {
    setCurrentClip(state, action: PayloadAction<string | null>) {
      state.currentClipUri = action.payload;
      state.transformedUri = null; // reset result when source changes
    },
    setTransformed(state, action: PayloadAction<string | null>) {
      state.transformedUri = action.payload;
    },
    setCalculating(state, action: PayloadAction<boolean>) {
      state.isCalculating = action.payload;
    },
  },
});

export const { setCurrentClip, setTransformed, setCalculating } = raveSlice.actions;
export default raveSlice.reducer;