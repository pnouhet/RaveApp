import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

const FONT = 'ClimateCrisis_400Regular';
const PRIMARY = '#352360';

interface AudioPlayerProps {
  uri: string | null;
  label: string;
}

// Reusable play/pause button. Shows disabled state when uri is null.
export default function AudioPlayer({ uri, label }: AudioPlayerProps) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const mounted = useRef(false);

  // When uri changes after initial mount, replace the player source explicitly.
  // useAudioPlayer initialises on mount; subsequent prop changes need this effect.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (uri) {
      player.replace(uri);
    }
  }, [uri, player]);

  const isPlaying = status.playing;
  const disabled = !uri;

  const handlePress = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isPlaying ? 'pause-circle' : 'play-circle'}
          size={56}
          color={disabled ? '#ccc' : PRIMARY}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
  label: { fontSize: 14, color: '#555', marginBottom: 4, fontFamily: FONT },
  labelDisabled: { color: '#bbb' },
  button: { padding: 8 },
  disabled: { opacity: 0.4 },
});
