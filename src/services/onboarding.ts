import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDED_KEY = 'climatewise:onboarded';

export async function hasOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
  } catch (error) {
    console.warn('Could not read onboarding state', error);
    return false;
  }
}

export async function setOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  } catch (error) {
    console.warn('Could not save onboarding state', error);
  }
}

export async function resetOnboarded(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDED_KEY);
  } catch (error) {
    console.warn('Could not reset onboarding state', error);
  }
}