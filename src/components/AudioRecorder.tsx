import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  useAudioRecorderState,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#352360';

interface AudioRecorderProps {
  // Called with the cache URI when the user stops recording.
  onRecordingComplete: (uri: string) => void;
}

// Record/Stop button. Requests mic permission on mount.
export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission refusée', "L'accès au microphone est nécessaire pour enregistrer.");
      }
      await AudioModule.setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })();
    return () => {
      // Stop any in-progress recording on unmount; ignore if already stopped.
      try { audioRecorder.stop(); } catch {}
    };
  }, []);

  const handleRecord = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const handleStop = async () => {
    await audioRecorder.stop();
    if (audioRecorder.uri) {
      onRecordingComplete(audioRecorder.uri);
    }
  };

  const isRecording = recorderState.isRecording;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRecording && styles.recording]}
        onPress={isRecording ? handleStop : handleRecord}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isRecording ? 'stop-circle' : 'mic'}
          size={56}
          color={isRecording ? '#922e79' : PRIMARY}
        />
      </TouchableOpacity>
      <Text style={styles.status}>
        {isRecording ? 'Enregistrement…' : 'Appuyer pour enregistrer'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 12 },
  button: {
    padding: 16,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  recording: { backgroundColor: '#ffbdef' },
  status: { marginTop: 8, fontSize: 14, color: '#666', fontFamily: 'Inter', fontWeight: 600, },
});
