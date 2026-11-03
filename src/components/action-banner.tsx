import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

type ActionBannerProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function ActionBanner({ title, subtitle, onPress }: ActionBannerProps) {
  return (
    <Pressable style={styles.banner} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.action,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.white,
    fontSize: 13,
  },
});