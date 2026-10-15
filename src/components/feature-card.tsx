import { Pressable, StyleSheet, Text } from 'react-native';

type FeatureCardProps = {
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
};

export function FeatureCard({ title, subtitle, color, onPress }: FeatureCardProps) {
  return (
    <Pressable
      style={[styles.card, { backgroundColor: color }]}
      onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 110,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'flex-end',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 4,
  },
});