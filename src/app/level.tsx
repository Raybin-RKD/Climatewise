import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

const LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: "No prior knowledge. Let's start from the basics.",
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'I know a little about climate change.',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'I want to go deeper into the details.',
  },
];

export default function LevelScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('beginner');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Choose your learning level</ThemedText>
        <ThemedText>This helps us give you the right content and challenges.</ThemedText>

        {LEVELS.map((level) => (
          <Pressable key={level.id} onPress={() => setSelected(level.id)}>
            <ThemedView
              type="backgroundElement"
              style={[styles.card, selected === level.id && styles.cardSelected]}>
              <ThemedText type="smallBold">{level.title}</ThemedText>
              <ThemedText type="small">{level.description}</ThemedText>
            </ThemedView>
          </Pressable>
        ))}

        <AppButton label="Continue" onPress={() => router.replace('/')} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: Spacing.one,
  },
  cardSelected: {
    borderColor: Colors.primary,
  },
});