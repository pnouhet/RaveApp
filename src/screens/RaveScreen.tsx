import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setCurrentClip, setTransformed, setCalculating } from '../store/raveSlice';
import { setModels, setSelectedModel } from '../store/serverSlice';
import { getModels, selectModel, uploadClip, downloadResult, buildBaseUrl } from '../services/api';
import ModelPicker from '../components/ModelPicker';
import AudioPlayer from '../components/AudioPlayer';

const FONT = 'ClimateCrisis_400Regular';
const PRIMARY = '#352360';

// ─── Inner tab: from saved recordings ──────────────────────────────────────
function RecordingsTab() {
  const dispatch = useAppDispatch();
  const recordings = useAppSelector((s) => s.recordings.recordings);
  const currentClipUri = useAppSelector((s) => s.rave.currentClipUri);

  return (
    <View style={tabStyles.recordingsContainer}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={tabStyles.emptyText}>
            {"Aucun enregistrement — allez dans l'onglet Record."}
          </Text>
        }
        renderItem={({ item }) => {
          const active = currentClipUri === item.uri;
          return (
            <TouchableOpacity
              style={[tabStyles.recordingRow, active && tabStyles.activeRow]}
              onPress={() => dispatch(setCurrentClip(item.uri))}
            >
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={active ? PRIMARY : '#ccc'}
              />
              <Text style={[tabStyles.recordingName, active && tabStyles.activeName]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ─── Inner tab: pick file from device ──────────────────────────────────────
function FilesTab() {
  const dispatch = useAppDispatch();
  const [fileName, setFileName] = useState<string | null>(null);

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        dispatch(setCurrentClip(asset.uri));
        setFileName(asset.name ?? 'Fichier sélectionné');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le sélecteur de fichiers.');
    }
  };

  return (
    <View style={tabStyles.container}>
      <Ionicons name="folder-open-outline" size={52} color={PRIMARY} style={tabStyles.icon} />
      <TouchableOpacity style={tabStyles.selectButton} onPress={handlePick}>
        <Text style={tabStyles.selectText}>Choisir un fichier audio</Text>
      </TouchableOpacity>
      {fileName && (
        <Text style={tabStyles.fileName} numberOfLines={2}>
          {fileName}
        </Text>
      )}
    </View>
  );
}

// ─── Main RaveScreen ────────────────────────────────────────────────────────
const renderScene = SceneMap({
  recordings: RecordingsTab,
  files: FilesTab,
});

const INNER_ROUTES = [
  { key: 'recordings', title: 'Mes enregistrements' },
  { key: 'files', title: 'Fichier' },
];

export default function RaveScreen() {
  const dispatch = useAppDispatch();
  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState(0);

  const { ip, port, models, selectedModel } = useAppSelector((s) => s.server);
  const { currentClipUri, transformedUri, isCalculating } = useAppSelector((s) => s.rave);

  // Load models when the screen mounts (requires server connection).
  useEffect(() => {
    if (!ip || !port) return;
    const baseUrl = buildBaseUrl(ip, port);
    getModels(baseUrl)
      .then((list) => dispatch(setModels(list)))
      .catch(() => {}); // Silent fail: server may not be connected yet.
  }, [ip, port, dispatch]);

  const handleSelectModel = useCallback(
    async (name: string) => {
      if (!ip || !port) {
        Alert.alert('Non connecté', "Configurez la connexion dans l'onglet Home.");
        return;
      }
      try {
        await selectModel(buildBaseUrl(ip, port), name);
        dispatch(setSelectedModel(name));
      } catch {
        Alert.alert('Erreur', `Impossible de sélectionner le modèle "${name}".`);
      }
    },
    [ip, port, dispatch]
  );

  const handleSend = async () => {
    if (!currentClipUri) {
      Alert.alert('Aucun clip', "Sélectionnez un clip dans l'un des onglets ci-dessus.");
      return;
    }
    if (!ip || !port) {
      Alert.alert('Non connecté', "Configurez la connexion dans l'onglet Home.");
      return;
    }
    // Verify file exists and is non-empty before sending to server.
    const info = await FileSystem.getInfoAsync(currentClipUri);
    if (!info.exists) {
      Alert.alert('Fichier introuvable', "Le fichier audio sélectionné n'existe plus. Sélectionnez-en un autre.");
      return;
    }
    if ('size' in info && info.size === 0) {
      Alert.alert('Fichier vide', 'Le fichier audio est vide. Utilisez un enregistrement ou un fichier valide.');
      return;
    }
    const baseUrl = buildBaseUrl(ip, port);
    dispatch(setCalculating(true));
    try {
      await uploadClip(baseUrl, currentClipUri);
      const resultUri = await downloadResult(baseUrl);
      dispatch(setTransformed(resultUri));
    } catch (e) {
      Alert.alert('Erreur', `Traitement échoué: ${(e as Error).message}`);
    } finally {
      dispatch(setCalculating(false));
    }
  };

  return (
    <View style={styles.container}>
      {/* Inner tab view — source selection */}
      <View style={styles.tabViewWrapper}>
        <TabView
          navigationState={{ index: tabIndex, routes: INNER_ROUTES }}
          renderScene={renderScene}
          onIndexChange={setTabIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              style={tabStyles.innerTabBar}
              indicatorStyle={tabStyles.innerTabIndicator}
              labelStyle={tabStyles.innerTabLabel}
              activeColor={PRIMARY}
              inactiveColor="#000000"
            />
          )}
        />
      </View>

      {/* Model selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modèle</Text>
        <ModelPicker
          models={models}
          selected={selectedModel}
          onSelect={handleSelectModel}
        />
      </View>

      {/* Send button */}
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!currentClipUri || isCalculating) && styles.sendDisabled,
        ]}
        onPress={handleSend}
        disabled={!currentClipUri || isCalculating}
        activeOpacity={0.8}
      >
        {isCalculating ? (
          <>
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sendText}>Calcul en cours…</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={22} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.sendText}>Envoyer au serveur</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Playback section — key forces remount when URI changes so useAudioPlayer reinitialises */}
      <View style={styles.playbackRow}>
        <View style={styles.playerSlot}>
          <AudioPlayer key={currentClipUri ?? 'orig-empty'} uri={currentClipUri} label="Original" />
        </View>
        <View style={styles.playerSlot}>
          <AudioPlayer key={transformedUri ?? 'trans-empty'} uri={transformedUri} label="Transformé" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  tabViewWrapper: { flex: 1, width: '100%' },
  section: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontFamily: FONT, color: '#555', marginLeft: 16, marginBottom: 4 },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 18,
    borderRadius: 14,
  },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: '#fff', fontFamily: FONT, fontSize: 18 },
  playbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 8,
  },
  playerSlot: { alignItems: 'center', flex: 1 },
});

const tabStyles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  recordingsContainer: { flex: 1 },
  icon: { marginBottom: 12 },
  selectButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  selectText: { color: '#fff', fontFamily: FONT, fontSize: 16 },
  fileName: { marginTop: 10, fontSize: 14, color: '#444', textAlign: 'center', fontFamily: FONT },
  emptyText: { textAlign: 'center', color: '#aaa', fontStyle: 'italic', marginTop: 24, fontFamily: FONT },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  activeRow: { backgroundColor: '#F0EBF8' },
  recordingName: { fontSize: 16, color: '#333', fontFamily: FONT },
  activeName: { color: PRIMARY },
  innerTabBar: { flexDirection: 'column', backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
  innerTabLabel: { fontFamily: FONT, fontSize: 13, textTransform: 'none' },
  innerTabIndicator: { backgroundColor: PRIMARY, height: 2 },
});
