import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native'
import { CameraView } from 'expo-camera'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import ScannerOverlay from '../components/ScannerOverlay'
import { getActiveIncubations, bindChariotToIncubation } from '../services/incubationService'
import { savePendingIncubationScan } from '../services/offlineStorage'
import { playScanSuccess, playScanError, playButtonPress } from '../services/soundService'

export default function ModeIncubationScreen({ initialChariot = null, isOnline = true }) {
  const [torchOn, setTorchOn] = useState(false)
  const [incubations, setIncubations] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [scannedChariots, setScannedChariots] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingChariot, setSavingChariot] = useState(false)
  const [lastScanned, setLastScanned] = useState(null)

  // Load active incubation sessions
  useEffect(() => {
    async function loadSessions() {
      setLoading(true)
      const docs = await getActiveIncubations()
      setIncubations(docs)
      if (docs.length > 0) {
        setSelectedDoc(docs[0])
        const existingList = (docs[0].incubation_lignes || []).map(l => l.n_chariot)
        setScannedChariots(existingList)
      }
      setLoading(false)
    }
    loadSessions()
  }, [])

  // If navigated with a pre-scanned chariot
  useEffect(() => {
    if (initialChariot && selectedDoc) {
      handleAddChariot(initialChariot)
    }
  }, [initialChariot, selectedDoc])

  const handleBarcodeScanned = async ({ data }) => {
    if (savingChariot) return
    await handleAddChariot(data)
  }

  const handleAddChariot = async (code) => {
    const clean = code.trim()
    if (!selectedDoc) {
      Alert.alert('Attention', 'Veuillez sélectionner une session d\'incubation.')
      return
    }

    // Check duplicate in current session
    if (scannedChariots.includes(clean)) {
      await playScanError()
      Alert.alert('Chariot déjà présent', `Le chariot ${clean} est déjà enregistré dans cette session !`)
      return
    }

    setSavingChariot(true)
    setLastScanned(clean)

    if (isOnline) {
      const res = await bindChariotToIncubation(selectedDoc.id, clean, 4800)
      if (res.success) {
        await playScanSuccess()
        setScannedChariots(prev => [clean, ...prev])
      } else if (res.duplicate) {
        await playScanError()
        Alert.alert('Chariot déjà scanné', res.message)
      } else {
        // Fallback to offline save
        await savePendingIncubationScan({ docId: selectedDoc.id, nChariot: clean, timestamp: new Date().toISOString() })
        await playScanSuccess()
        setScannedChariots(prev => [clean, ...prev])
      }
    } else {
      // Offline mode
      await savePendingIncubationScan({ docId: selectedDoc.id, nChariot: clean, timestamp: new Date().toISOString() })
      await playScanSuccess()
      setScannedChariots(prev => [clean, ...prev])
    }

    setSavingChariot(false)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const p = dateStr.split('-')
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`
    return dateStr
  }

  return (
    <View style={styles.container}>
      {/* Session Selector Strip */}
      <View style={styles.sessionSelector}>
        <Text style={styles.selectorLabel}>SESSION INCUBATION :</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#4f46e5" />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={incubations}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.sessionList}
            renderItem={({ item }) => {
              const isSelected = selectedDoc?.id === item.id
              return (
                <TouchableOpacity
                  style={[styles.sessionPill, isSelected && styles.sessionPillActive]}
                  onPress={async () => {
                    await playButtonPress()
                    setSelectedDoc(item)
                    const lines = (item.incubation_lignes || []).map(l => l.n_chariot)
                    setScannedChariots(lines)
                  }}
                >
                  <Text style={[styles.sessionPillText, isSelected && styles.sessionPillTextActive]}>
                    Bon #{item.doc_number || item.id.slice(0, 4)} ({formatDate(item.date_incubation)})
                  </Text>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>

      {/* Camera Live Viewfinder */}
      <View style={styles.cameraBox}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'itf14'],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />

        <ScannerOverlay
          torchOn={torchOn}
          onToggleTorch={() => setTorchOn(!torchOn)}
          onManualSubmit={handleAddChariot}
          hint="Scannez les chariots à ajouter à cette incubation"
          isScanning={!savingChariot}
        />
      </View>

      {/* Bottom Summary & Chariots List */}
      <View style={styles.bottomListPanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Chariots enregistrés</Text>
            <Text style={styles.panelSubtitle}>
              Total : {scannedChariots.length} chariot(s) ({ (scannedChariots.length * 4800).toLocaleString('fr-FR') } OAC)
            </Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{scannedChariots.length}</Text>
          </View>
        </View>

        {scannedChariots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-outline" size={32} color="#cbd5e1" />
            <Text style={styles.emptyPrompt}>Aucun chariot scanné pour le moment</Text>
          </View>
        ) : (
          <FlatList
            data={scannedChariots}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chariotsHorizontalList}
            renderItem={({ item, index }) => (
              <View style={[styles.chariotChip, item === lastScanned && styles.chariotChipHighlight]}>
                <MaterialCommunityIcons
                  name="cart"
                  size={16}
                  color={item === lastScanned ? '#4f46e5' : '#475569'}
                />
                <Text style={styles.chariotChipText}>Chariot {item}</Text>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexBadgeText}>#{index + 1}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  sessionSelector: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  selectorLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  sessionList: {
    gap: 8,
  },
  sessionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  sessionPillActive: {
    backgroundColor: '#4f46e5',
  },
  sessionPillText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  sessionPillTextActive: {
    color: '#ffffff',
  },
  cameraBox: {
    flex: 1.2,
    position: 'relative',
  },
  bottomListPanel: {
    flex: 0.8,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  panelSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  counterBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: '#4338ca',
    fontWeight: '900',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPrompt: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '600',
  },
  chariotsHorizontalList: {
    gap: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  chariotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  chariotChipHighlight: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  chariotChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  indexBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  indexBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
  },
})
