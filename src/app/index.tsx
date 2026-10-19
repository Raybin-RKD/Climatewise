import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeatureCard } from '@/components/feature-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const FEATURES = [
  { id: 'learn', title: 'Learn', subtitle: 'Explore key concepts', color: Colors.learn },
  { id: 'data', title: 'Explore Data', subtitle: 'See real climate data', color: Colors.data },
  { id: 'quiz', title: 'Quiz', subtitle: 'Test your knowledge', color: Colors.quiz },
  { id: 'challenge', title: 'Climate Challenge', subtitle: 'Make choices', color: Colors.challenge },
];

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Hello ClimateWise!
        </ThemedText>

        <ThemedView style={styles.grid}>
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.id}
              title={feature.title}
              subtitle={feature.subtitle}
              color={feature.color}
              onPress={() => Alert.alert(feature.title, 'Coming soon')}
            />
          ))}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
});