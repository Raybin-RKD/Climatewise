import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

type HeroCardProps = {
  title: string;
  buttonLabel: string;
  onPress: () => void;
};

export function HeroCard({ title, buttonLabel, onPress }: HeroCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.buttonLabel}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  buttonLabel: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});