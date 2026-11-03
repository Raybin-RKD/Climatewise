import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

type ProgressCardProps = {
  levelTitle: string;
  completed: number;
  total: number;
};

export function ProgressCard({ levelTitle, completed, total }: ProgressCardProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.circle}>
        <ThemedText type="smallBold">{percent}%</ThemedText>
      </View>

      <View style={styles.info}>
        <ThemedText type="smallBold">{levelTitle}</ThemedText>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <ThemedText type="small">
          {completed} of {total} lessons completed
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.one,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});