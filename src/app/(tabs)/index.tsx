import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionBanner } from '@/components/action-banner';
import { AppButton } from '@/components/app-button';
import { FeatureCard } from '@/components/feature-card';
import { HeroCard } from '@/components/hero-card';
import { ProgressCard } from '@/components/progress-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { hasOnboarded, resetOnboarded } from '@/services/onboarding';

type Feature = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  href?: Href;
};

const FEATURES: Feature[] = [
  { id: 'learn', title: 'Learn', subtitle: 'Explore key concepts', color: Colors.learn, href: '/learn' },
  { id: 'data', title: 'Explore Data', subtitle: 'See real climate data', color: Colors.data, href: '/data' },
  { id: 'quiz', title: 'Quiz', subtitle: 'Test your knowledge', color: Colors.quiz, href: '/quiz' },
  { id: 'challenge', title: 'Climate Challenge', subtitle: 'Make choices', color: Colors.challenge },
];

export default function HomeScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hasOnboarded().then((done) => {
        if (!active) return;
        if (done) {
          setReady(true);
        } else {
          setReady(false);
          router.replace('/welcome');
        }
      });

      return () => {
        active = false;
      };
    }, [router])
  );

  if (!ready) {
    return null;
  }

  const handlePress = (feature: Feature) => {
    if (feature.href) {
      router.push(feature.href);
    } else {
      Alert.alert(feature.title, 'Coming soon');
    }
  };

  // TEMPORARY: lets you see the welcome flow again while testing.
  const handleReset = async () => {
    await resetOnboarded();
    router.replace('/welcome');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Hello ClimateWise!</ThemedText>
            <ThemedText type="small">Small steps make a big difference.</ThemedText>
          </ThemedView>

          <HeroCard
            title="A healthier planet starts with awareness."
            buttonLabel="Continue Learning"
            onPress={() => router.push('/learn')}
          />

          <ProgressCard levelTitle="Level 1: Climate Basics" completed={2} total={5} />

          <ThemedView style={styles.grid}>
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.id}
                title={feature.title}
                subtitle={feature.subtitle}
                color={feature.color}
                onPress={() => handlePress(feature)}
              />
            ))}
          </ThemedView>

          <ActionBanner
            title="What Can I Do?"
            subtitle="Simple actions for a greener future"
            onPress={() => Alert.alert('What Can I Do?', 'Coming soon')}
          />

          <AppButton label="Reset welcome (testing)" onPress={handleReset} />
        </ScrollView>
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
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  header: {
    marginTop: Spacing.four,
    gap: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
});