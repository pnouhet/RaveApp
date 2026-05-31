import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const FONT = 'ClimateCrisis_400Regular';
const PRIMARY = '#352360';

interface ModelPickerProps {
  models: string[];
  selected: string;
  onSelect: (name: string) => void;
}

// Horizontal scrollable row of model chips.
export default function ModelPicker({ models, selected, onSelect }: ModelPickerProps) {
  if (models.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucun modèle — connectez-vous dabord</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {models.map((model) => {
        const active = model === selected;
        return (
          <TouchableOpacity
            key={model}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(model)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {model}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipText: { fontSize: 15, color: '#333', fontFamily: FONT },
  chipTextActive: { color: '#fff' },
  empty: { padding: 16 },
  emptyText: { fontSize: 13, color: '#999', fontStyle: 'italic', fontFamily: FONT },
});
