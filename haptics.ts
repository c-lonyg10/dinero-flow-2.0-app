import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export const getHapticSettings = (): { enabled: boolean; intensity: HapticIntensity } => {
  const enabled = localStorage.getItem('dinero_haptics_enabled') !== 'false'; // default to true
  const intensity = (localStorage.getItem('dinero_haptic_intensity') as HapticIntensity) || 'light';
  return { enabled, intensity };
};

export const setHapticSettings = (enabled: boolean, intensity: HapticIntensity): void => {
  localStorage.setItem('dinero_haptics_enabled', String(enabled));
  localStorage.setItem('dinero_haptic_intensity', intensity);
};

export const triggerHaptic = async (overrideIntensity?: HapticIntensity): Promise<void> => {
  try {
    const { enabled, intensity } = getHapticSettings();
    if (!enabled) return;

    const target = overrideIntensity || intensity;
    let style = ImpactStyle.Light;
    if (target === 'medium') style = ImpactStyle.Medium;
    if (target === 'heavy') style = ImpactStyle.Heavy;

    await Haptics.impact({ style });
  } catch (err) {
    // Graceful no-op in desktop browsers
  }
};

export const triggerHapticSuccess = async (): Promise<void> => {
  try {
    const { enabled } = getHapticSettings();
    if (!enabled) return;
    await Haptics.notification({ type: NotificationType.Success });
  } catch (err) {
    // Graceful no-op
  }
};

export const triggerHapticWarning = async (): Promise<void> => {
  try {
    const { enabled } = getHapticSettings();
    if (!enabled) return;
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (err) {
    // Graceful no-op
  }
};