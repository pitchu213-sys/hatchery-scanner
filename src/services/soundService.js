import * as Haptics from 'expo-haptics'
import { Audio } from 'expo-av'

let soundObject = null

export const playScanSuccess = async () => {
  try {
    // 1. Trigger tactile haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch (e) {
    // ignore on simulators or unsupported devices
  }

  try {
    // 2. Play audible confirmation beep
    // Web Audio / Base64 beep sound (high pitched short beep 800Hz 80ms)
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
      { shouldPlay: true, volume: 1.0 }
    )
    soundObject = sound
  } catch (e) {
    // Fallback: silent continue
  }
}

export const playScanError = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } catch (e) {}

  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3' },
      { shouldPlay: true, volume: 1.0 }
    )
    soundObject = sound
  } catch (e) {}
}

export const playButtonPress = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch (e) {}
}
