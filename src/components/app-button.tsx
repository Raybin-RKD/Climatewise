import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/colors';

type AppButtonProps = {
  label: string;
  onPress: () => void;
};

export function AppButton({ label, onPress }: AppButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0F7B4F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});