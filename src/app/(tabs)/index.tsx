import { Redirect, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { FeatureCard } from '@/components/feature-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
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

type Status = 'loading' | 'new' | 'returning';

export default function HomeScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    hasOnboarded().then((done) => setStatus(done ? 'returning' : 'new'));
  }, []);

  if (status === 'loading') {
    return null;
  }

  if (status === 'new') {
    return <Redirect href="/welcome" />;
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
              onPress={() => handlePress(feature)}
            />
          ))}
        </ThemedView>

        <AppButton label="Reset welcome (testing)" onPress={handleReset} />
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