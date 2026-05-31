import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { addRecording, removeRecording } from '../store/recordingSlice';
import AudioRecorder from '../components/AudioRecorder';
import AudioPlayer from '../components/AudioPlayer';
import type { Recording } from '../types';

const FONT = 'ClimateCrisis_400Regular';
const PRIMARY = '#352360';
const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';

// Self-contained row: play/pause directly on first tap, no intermediate step.
function RecordingItem({ item, onDelete }: { item: Recording; onDelete: () => void }) {
  const player = useAudioPlayer(item.uri);
  const status = useAudioPlayerStatus(player);

  const handlePlayPause = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={styles.recordingItem}>
      <Text style={styles.recordingName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.recordingActions}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.iconButton}>
          <Ionicons
            name={status.playing ? 'pause-circle' : 'play-circle'}
            size={32}
            color={PRIMARY}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
          <Ionicons name="trash-outline" size={28} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RecordScreen() {
  const dispatch = useAppDispatch();
  const recordings = useAppSelector((s) => s.recordings.recordings);

  // URI of the last recording not yet saved (lives in Expo cache).
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  // Save dialog state.
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleRecordingComplete = (uri: string) => {
    setPendingUri(uri);
  };

  const openSaveDialog = () => {
    if (!pendingUri) return;
    setSaveName('');
    setSaveModalVisible(true);
  };

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) {
      Alert.alert('Erreur', 'Donnez un nom à votre enregistrement.');
      return;
    }
    setSaveModalVisible(false);
    try {
      // Ensure the persistent recordings directory exists.
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
      const id = Date.now().toString();
      const ext = pendingUri!.split('.').pop() ?? 'm4a';
      const destUri = `${RECORDINGS_DIR}${id}.${ext}`;
      // Copy from cache to persistent storage.
      await FileSystem.copyAsync({ from: pendingUri!, to: destUri });
      // Clean up the cache file.
      await FileSystem.deleteAsync(pendingUri!, { idempotent: true });
      dispatch(addRecording({ id, name, uri: destUri }));
      setPendingUri(null);
    } catch (e) {
      Alert.alert('Erreur', `Impossible de sauvegarder: ${(e as Error).message}`);
    }
  };

  const handleDelete = async (recording: Recording) => {
    Alert.alert('Supprimer', `Supprimer "${recording.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await FileSystem.deleteAsync(recording.uri, { idempotent: true });
          dispatch(removeRecording(recording.id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enregistrement</Text>

      <AudioRecorder onRecordingComplete={handleRecordingComplete} />

      {/* Preview of the latest unsaved recording */}
      {pendingUri && (
        <View style={styles.pendingSection}>
          <AudioPlayer uri={pendingUri} label="Aperçu" />
          <TouchableOpacity style={styles.saveButton} onPress={openSaveDialog}>
            <Ionicons name="save-outline" size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Enregistrements sauvegardés</Text>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun enregistrement pour le moment.</Text>
        }
        renderItem={({ item }) => (
          <RecordingItem item={item} onDelete={() => handleDelete(item)} />
        )}
      />

      {/* Save name dialog */}
      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{"Nom de l'enregistrement"}</Text>
            <TextInput
              style={styles.modalInput}
              value={saveName}
              onChangeText={setSaveName}
              placeholder="ex: Voix test 1"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontFamily: FONT, textAlign: 'center', marginTop: 20, marginBottom: 8, color: '#111' },
  pendingSection: { alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#208e81',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  saveButtonText: { color: '#fff', fontFamily: FONT, fontSize: 16 },
  sectionTitle: { fontSize: 16, fontFamily: FONT, color: '#555', marginTop: 16, marginLeft: 16 },
  list: { flex: 1, marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 24, fontStyle: 'italic', fontFamily: FONT },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  recordingName: { flex: 1, fontSize: 16, color: '#222', fontFamily: FONT },
  recordingActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' },
  modalTitle: { fontSize: 18, fontFamily: FONT, marginBottom: 12, color: '#111' },
  modalInput: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 17,
    marginBottom: 16,
    backgroundColor: '#fafafa',
    fontFamily: FONT,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 18 },
  modalCancelText: { color: '#666', fontSize: 16, fontFamily: FONT },
  modalConfirm: { backgroundColor: PRIMARY, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  modalConfirmText: { color: '#fff', fontFamily: FONT, fontSize: 16 },
});
