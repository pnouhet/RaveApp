import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setIp, setPort, setConnected } from '../store/serverSlice';
import { testConnection, buildBaseUrl } from '../services/api';

const FONT = 'ClimateCrisis_400Regular';
const PRIMARY = '#352360';

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { ip, port, isConnected } = useAppSelector((s) => s.server);

  // Local state: values in the text inputs before the user validates them.
  const [localIp, setLocalIp] = useState(ip);
  const [localPort, setLocalPort] = useState(port);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!localIp.trim() || !localPort.trim()) {
      Alert.alert('Erreur', 'Saisissez une adresse IP et un port.');
      return;
    }
    // Commit local values to Redux before testing.
    dispatch(setIp(localIp.trim()));
    dispatch(setPort(localPort.trim()));
    setTesting(true);
    dispatch(setConnected(false));
    try {
      const ok = await testConnection(buildBaseUrl(localIp.trim(), localPort.trim()));
      dispatch(setConnected(ok));
      Alert.alert(ok ? 'Connexion réussie' : 'Échec', ok ? 'Serveur accessible !' : 'Le serveur ne répond pas.');
    } catch {
      dispatch(setConnected(false));
      Alert.alert('Erreur réseau', "Impossible de joindre le serveur. Vérifiez l'IP et le port.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <View style={styles.container}>
        <Ionicons
          name={isConnected ? 'wifi' : 'wifi-outline'}
          size={72}
          color={isConnected ? '#208e81' : '#ccc'}
          style={styles.icon}
        />
        <Text style={styles.title}>Connexion serveur</Text>

        <Text style={styles.label}>Adresse IP</Text>
        <TextInput
          style={styles.input}
          value={localIp}
          onChangeText={setLocalIp}
          placeholder="ex: 192.168.1.42"
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          value={localPort}
          onChangeText={setLocalPort}
          placeholder="ex: 5000"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.button, testing && styles.buttonDisabled]}
          onPress={handleTest}
          disabled={testing}
          activeOpacity={0.8}
        >
          {testing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Tester la connexion</Text>
          )}
        </TouchableOpacity>

        {isConnected && (
          <Text style={styles.connected}>
            <Ionicons name="checkmark-circle" size={16} color="#208e81" /> Connecté à{' '}
            {ip}:{port}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  icon: { marginBottom: 16 },
  title: { fontSize: 24, fontFamily: FONT, textAlign: 'center', marginBottom: 24, color: '#111' },
  label: { alignSelf: 'stretch', fontSize: 15, color: '#555', marginBottom: 6, marginTop: 14, fontFamily: FONT },
  input: {
    alignSelf: 'stretch',
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 17,
    backgroundColor: '#fafafa',
    fontFamily: 'Inter',
    fontWeight: 600,
  },
  button: {
    marginTop: 28,
    width: '100%',
    height: 56,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontFamily: FONT, fontSize: 18 },
  connected: { marginTop: 16, color: '#208e81', fontSize: 14, fontFamily: FONT },
});
