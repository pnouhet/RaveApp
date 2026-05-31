// Shared domain types used across slices, screens, and services.

export interface Recording {
  id: string;
  name: string;
  uri: string; // absolute path in FileSystem.documentDirectory/recordings/
}

export interface ServerState {
  ip: string;
  port: string;
  isConnected: boolean;
  models: string[];
  selectedModel: string;
}

export interface RecordingsState {
  recordings: Recording[];
}

export interface RaveState {
  currentClipUri: string | null;
  transformedUri: string | null;
  isCalculating: boolean;
}