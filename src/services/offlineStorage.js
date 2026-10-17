import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEYS = {
  PENDING_INCUBATION_SCANS: '@hatchery:pending_incubation_scans',
  PENDING_MIRAGE_SCANS: '@hatchery:pending_mirage_scans',
  CACHED_CHARIOTS: '@hatchery:cached_chariots',
}

export const savePendingIncubationScan = async (scanItem) => {
  try {
    const existing = await getPendingIncubationScans()
    const updated = [scanItem, ...existing]
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INCUBATION_SCANS, JSON.stringify(updated))
    return true
  } catch (e) {
    console.error('Error saving pending scan:', e)
    return false
  }
}

export const getPendingIncubationScans = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INCUBATION_SCANS)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export const clearPendingIncubationScans = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_INCUBATION_SCANS)
  } catch (e) {}
}

export const savePendingMirageEntry = async (mirageItem) => {
  try {
    const existing = await getPendingMirageEntries()
    const updated = [mirageItem, ...existing]
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_MIRAGE_SCANS, JSON.stringify(updated))
    return true
  } catch (e) {
    console.error('Error saving pending mirage:', e)
    return false
  }
}

export const getPendingMirageEntries = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_MIRAGE_SCANS)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export const clearPendingMirageEntries = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_MIRAGE_SCANS)
  } catch (e) {}
}
