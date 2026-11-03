import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDED_KEY = 'climatewise:onboarded';

export async function hasOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  } catch {
    // Saving failed: the user will simply see the welcome screens again.
  }
}

export async function resetOnboarded(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDED_KEY);
  } catch {
    // Nothing to do.
  }
}