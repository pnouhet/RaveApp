import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RecordingsState, Recording } from '../types';

const initialState: RecordingsState = {
  recordings: [],
};

const recordingsSlice = createSlice({
  name: 'recordings',
  initialState,
  reducers: {
    addRecording(state, action: PayloadAction<Recording>) {
      state.recordings.push(action.payload);
    },
    removeRecording(state, action: PayloadAction<string>) {
      state.recordings = state.recordings.filter((r) => r.id !== action.payload);
    },
  },
});

export const { addRecording, removeRecording } = recordingsSlice.actions;
export default recordingsSlice.reducer;