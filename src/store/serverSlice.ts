import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ServerState } from './../types/index';

export const initialServerState: ServerState = {
    ip: '192.168.1.129',
    port: '8000',
    isConnected: false,
    models: [],
    selectedModel: '',
};

const serverSlice = createSlice({
    name: 'server',
    initialState: initialServerState,
    reducers: {
        setIp(state, action: PayloadAction<string>) {
            state.ip = action.payload;
        },
        setPort(state, action: PayloadAction<string>) {
            state.port = action.payload;
        },
        setConnected(state, action: PayloadAction<boolean>) {
            state.isConnected = action.payload;
        },
        setModels(state, action: PayloadAction<string[]>) {
            state.models = action.payload;
        },
        setSelectedModel(state, action: PayloadAction<string>) {
            state.selectedModel = action.payload;
        },
    },
});

export const { setIp, setPort, setConnected, setModels, setSelectedModel } = serverSlice.actions;
export default serverSlice.reducer;