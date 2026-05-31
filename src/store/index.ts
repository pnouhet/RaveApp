import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import serverReducer, { initialServerState } from './serverSlice';
import recordingsReducer from './recordingSlice';
import raveReducer from './raveSlice';
import type { ServerState } from '../types';

// Only persist ip + port from the server slice; reset transient fields on restart.
const serverTransform = createTransform<ServerState, { ip: string; port: string }>(
  (inbound) => ({ ip: inbound.ip, port: inbound.port }),
  (outbound) => ({ ...initialServerState, ...outbound }),
  { whitelist: ['server'] }
);

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['server', 'recordings'], // rave state is NOT persisted
  transforms: [serverTransform],
};

const rootReducer = combineReducers({
  server: serverReducer,
  recordings: recordingsReducer,
  rave: raveReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;