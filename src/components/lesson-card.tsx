import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Lesson } from '@/types/lesson';

type LessonCardProps = {
  lesson: Lesson;
  onPress: () => void;
};

export function LessonCard({ lesson, onPress }: LessonCardProps) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.info}>
          <ThemedText type="smallBold">
            {lesson.number}. {lesson.title}
          </ThemedText>
          <ThemedText type="small">
            {lesson.minutes} min · Lesson {lesson.number} · {lesson.category}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 16,
  },
  info: {
    gap: Spacing.one,
  },
});