import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import {
  getPendingIncubationScans,
  clearPendingIncubationScans,
  getPendingMirageEntries,
  clearPendingMirageEntries
} from '../services/offlineStorage'
import { bindChariotToIncubation } from '../services/incubationService'
import { saveChariotMirageFromMobile } from '../services/mirageService'
import { playScanSuccess, playScanError, playButtonPress } from '../services/soundService'

export default function SyncOfflineScreen({ isOnline = true, onRefreshStatus }) {
  const [pendingIncubations, setPendingIncubations] = useState([])
  const [pendingMirages, setPendingMirages] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadPendingData = async () => {
    setLoading(true)
    const incs = await getPendingIncubationScans()
    const mirs = await getPendingMirageEntries()
    setPendingIncubations(incs)
    setPendingMirages(mirs)
    setLoading(false)
  }

  useEffect(() => {
    loadPendingData()
  }, [])

  const handleSyncAll = async () => {
    if (!isOnline) {
      Alert.alert(
        'Connexion requise',
        'Votre appareil est actuellement hors-ligne. Veuillez vous connecter au Wi-Fi ou aux données mobiles pour synchroniser.'
      )
      return
    }

    const totalPending = pendingIncubations.length + pendingMirages.length
    if (totalPending === 0) {
      Alert.alert('Information', 'Aucune donnée en attente de synchronisation.')
      return
    }

    await playButtonPress()
    setSyncing(true)

    try {
      // 1. Sync incubation scans
      for (const item of pendingIncubations) {
        await bindChariotToIncubation(item.docId, item.nChariot)
      }
      await clearPendingIncubationScans()

      // 2. Sync mirage entries
      for (const item of pendingMirages) {
        await saveChariotMirageFromMobile(item.docId, item.nChariot, item.plateaux)
      }
      await clearPendingMirageEntries()

      await playScanSuccess()
      await loadPendingData()
      Alert.alert('Succès', `${totalPending} enregistrement(s) synchronisés avec succès vers Supabase !`)
    } catch (e) {
      await playScanError()
      Alert.alert('Erreur', 'Une erreur est survenue lors de la synchronisation : ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleClear = () => {
    Alert.alert(
      'Vider la file d\'attente',
      'Voulez-vous vraiment supprimer toutes les données locales en attente ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            await clearPendingIncubationScans()
            await clearPendingMirageEntries()
            await loadPendingData()
          }
        }
      ]
    )
  }

  const totalCount = pendingIncubations.length + pendingMirages.length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Network Status Banner */}
      <View style={[styles.networkCard, isOnline ? styles.networkOnline : styles.networkOffline]}>
        <View style={styles.networkLeft}>
          <Ionicons
            name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={28}
            color={isOnline ? '#059669' : '#d97706'}
          />
          <View>
            <Text style={styles.networkTitle}>
              {isOnline ? 'Connexion Active (Supabase)' : 'Mode Hors-Ligne (Mémoire Locale)'}
            </Text>
            <Text style={styles.networkSub}>
              {isOnline
                ? 'Les scans sont envoyés directement à la base de données'
                : 'Les scans sont stockés dans le téléphone en attendant le réseau'}
            </Text>
          </View>
        </View>
      </View>

      {/* Sync Queue Summary */}
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>FILE D'ATTENTE DE SYNCHRONISATION</Text>
        <View style={styles.queueBadge}>
          <Text style={styles.queueBadgeText}>{totalCount} en attente</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: 30 }} color="#4f46e5" />
      ) : totalCount === 0 ? (
        <View style={styles.allSyncedCard}>
          <Ionicons name="checkmark-done-circle" size={48} color="#10b981" />
          <Text style={styles.allSyncedTitle}>Toutes les données sont synchronisées</Text>
          <Text style={styles.allSyncedSub}>
            Aucun scan en attente. Votre téléphone est parfaitement à jour avec le serveur central.
          </Text>
        </View>
      ) : (
        <View style={styles.pendingList}>
          {/* Incubation pending */}
          {pendingIncubations.map((item, idx) => (
            <View key={`inc-${idx}`} style={styles.pendingItem}>
              <View style={styles.pendingItemLeft}>
                <MaterialCommunityIcons name="egg" size={20} color="#4f46e5" />
                <View>
                  <Text style={styles.pendingItemTitle}>Incubation &bull; Chariot {item.nChariot}</Text>
                  <Text style={styles.pendingItemSub}>Doc #{item.docId?.slice(0, 6)}</Text>
                </View>
              </View>
              <Text style={styles.pendingBadge}>En attente</Text>
            </View>
          ))}

          {/* Mirage pending */}
          {pendingMirages.map((item, idx) => (
            <View key={`mir-${idx}`} style={styles.pendingItem}>
              <View style={styles.pendingItemLeft}>
                <Ionicons name="flashlight" size={20} color="#f59e0b" />
                <View>
                  <Text style={styles.pendingItemTitle}>Mirage &bull; Chariot {item.nChariot}</Text>
                  <Text style={styles.pendingItemSub}>6 plateaux complétés</Text>
                </View>
              </View>
              <Text style={styles.pendingBadge}>En attente</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.syncBtn, (syncing || totalCount === 0) && styles.syncBtnDisabled]}
          disabled={syncing || totalCount === 0}
          onPress={handleSyncAll}
        >
          {syncing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="sync" size={20} color="#ffffff" />
              <Text style={styles.syncBtnText}>
                Synchroniser Tout ({totalCount})
              </Text>
            </>
          )}
        </TouchableOpacity>

        {totalCount > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Vider la file d'attente</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  networkCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  networkOnline: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  networkOffline: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  networkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  networkTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  networkSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queueTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  queueBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  queueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  allSyncedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 10,
  },
  allSyncedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  allSyncedSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  pendingList: {
    gap: 8,
    marginBottom: 24,
  },
  pendingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pendingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  pendingItemSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  pendingBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionSection: {
    gap: 12,
    marginTop: 12,
  },
  syncBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  syncBtnDisabled: {
    opacity: 0.5,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
})
