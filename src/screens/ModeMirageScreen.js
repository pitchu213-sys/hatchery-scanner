import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { CameraView } from 'expo-camera'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import ScannerOverlay from '../components/ScannerOverlay'
import { getChariotDetails } from '../services/chariotService'
import { saveChariotMirageFromMobile } from '../services/mirageService'
import { savePendingMirageEntry } from '../services/offlineStorage'
import { playScanSuccess, playScanError, playButtonPress } from '../services/soundService'

const DEFAULT_PLATEAUX = [
  { plateau: 'P3', nbre_clairs: 6 },
  { plateau: 'P9', nbre_clairs: 7 },
  { plateau: 'P14', nbre_clairs: 5 },
  { plateau: 'P19', nbre_clairs: 8 },
  { plateau: 'P25', nbre_clairs: 6 },
  { plateau: 'P30', nbre_clairs: 6 },
]

export default function ModeMirageScreen({ initialChariot = null, isOnline = true }) {
  const [torchOn, setTorchOn] = useState(false)
  const [currentChariot, setCurrentChariot] = useState(initialChariot)
  const [plateaux, setPlateaux] = useState(DEFAULT_PLATEAUX)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isScanning, setIsScanning] = useState(!initialChariot)

  const handleBarcodeScanned = async ({ data }) => {
    if (!isScanning || loading) return
    setIsScanning(false)
    await loadChariotForMirage(data)
  }

  const handleManualSubmit = async (code) => {
    setIsScanning(false)
    await loadChariotForMirage(code)
  }

  const loadChariotForMirage = async (code) => {
    setLoading(true)
    try {
      const details = await getChariotDetails(code)
      if (!details || !details.found) {
        await playScanError()
        Alert.alert(
          'Chariot non trouvé',
          `Le chariot ${code} n'est associé à aucune session d'incubation active.`
        )
        setIsScanning(true)
        return
      }

      await playScanSuccess()
      setCurrentChariot(details)
      // Reset default plateaux
      setPlateaux(DEFAULT_PLATEAUX.map(p => ({ ...p })))
    } catch (e) {
      await playScanError()
      Alert.alert('Erreur', 'Impossible de charger les données du chariot.')
      setIsScanning(true)
    } finally {
      setLoading(false)
    }
  }

  const updatePlateau = (idx, delta) => {
    setPlateaux(prev => {
      const updated = [...prev]
      const curr = updated[idx].nbre_clairs
      updated[idx].nbre_clairs = Math.max(0, Math.min(150, curr + delta))
      return updated
    })
  }

  // Live calculations for this chariot
  const sumSample = plateaux.reduce((s, p) => s + p.nbre_clairs, 0)
  const totalClairs = Math.round(sumSample * (16 / 3))
  const oacTotal = currentChariot?.oac_total || 4800
  const tauxClairs = oacTotal > 0 ? (totalClairs / oacTotal) * 100 : 0
  const fertilite = Math.max(0, 100 - tauxClairs)
  const poussinsPrevu = Math.round(oacTotal * ((fertilite * 0.90) / 100))

  const handleSaveMirage = async () => {
    if (!currentChariot || !currentChariot.doc_id) {
      Alert.alert('Erreur', 'Aucune session liée à ce chariot.')
      return
    }

    await playButtonPress()
    setSaving(true)

    try {
      if (isOnline) {
        const res = await saveChariotMirageFromMobile(
          currentChariot.doc_id,
          currentChariot.n_chariot,
          plateaux
        )
        if (!res.success) throw new Error(res.error)
      } else {
        // Save in offline queue
        await savePendingMirageEntry({
          docId: currentChariot.doc_id,
          nChariot: currentChariot.n_chariot,
          plateaux,
          timestamp: new Date().toISOString()
        })
      }

      await playScanSuccess()
      Alert.alert('Succès', `Mirage du Chariot ${currentChariot.n_chariot} enregistré avec succès !`, [
        {
          text: 'Scanner Chariot Suivant',
          onPress: () => {
            setCurrentChariot(null)
            setIsScanning(true)
          }
        }
      ])
    } catch (e) {
      await playScanError()
      Alert.alert('Erreur', 'Échec de l\'enregistrement : ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* If no chariot selected, show camera to scan */}
      {isScanning || !currentChariot ? (
        <View style={styles.fullCamera}>
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
            onManualSubmit={handleManualSubmit}
            hint="Scannez le chariot à mirer (Transfert)"
            isScanning={isScanning}
          />
        </View>
      ) : (
        /* Candling Entry View */
        <ScrollView style={styles.mirageForm} contentContainerStyle={styles.mirageFormContent}>
          {/* Chariot Banner */}
          <View style={styles.chariotBanner}>
            <View>
              <Text style={styles.bannerSuper}>SAISIE DU MIRAGE</Text>
              <Text style={styles.bannerTitle}>Chariot N° {currentChariot.n_chariot}</Text>
              <Text style={styles.bannerSub}>
                Lot {currentChariot.lot_code} &bull; {currentChariot.batiment} &bull; Bon #{currentChariot.doc_number}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => {
                setCurrentChariot(null)
                setIsScanning(true)
              }}
            >
              <Ionicons name="camera-reverse-outline" size={16} color="#4f46e5" />
              <Text style={styles.changeBtnText}>Changer</Text>
            </TouchableOpacity>
          </View>

          {/* KPI Strip for this chariot */}
          <View style={styles.kpiStrip}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>ÉCHANTILLON</Text>
              <Text style={styles.kpiValue}>{sumSample} / 900</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>CLAIRS TOT.</Text>
              <Text style={[styles.kpiValue, { color: '#b45309' }]}>{totalClairs}</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>% FERTILITÉ</Text>
              <Text style={[styles.kpiValue, { color: '#059669' }]}>{fertilite.toFixed(1)}%</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>POUSSINS</Text>
              <Text style={[styles.kpiValue, { color: '#4f46e5' }]}>{poussinsPrevu.toLocaleString('fr-FR')}</Text>
            </View>
          </View>

          {/* Plateaux 6 Levels Steppers */}
          <Text style={styles.sectionTitle}>Sondage des 6 Plateaux (150 œufs / plateau) :</Text>

          <View style={styles.plateauxList}>
            {plateaux.map((p, idx) => {
              const taux = ((p.nbre_clairs / 150) * 100).toFixed(1)
              return (
                <View key={p.plateau} style={styles.plateauCard}>
                  <View style={styles.plateauLeft}>
                    <View style={styles.plateauBadge}>
                      <Text style={styles.plateauBadgeText}>{p.plateau}</Text>
                    </View>
                    <Text style={styles.tauxText}>{taux}%</Text>
                  </View>

                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updatePlateau(idx, -1)}
                    >
                      <Ionicons name="remove" size={20} color="#1e293b" />
                    </TouchableOpacity>

                    <View style={styles.stepValueBox}>
                      <Text style={styles.stepValueText}>{p.nbre_clairs}</Text>
                      <Text style={styles.stepValueSub}>clairs</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updatePlateau(idx, 1)}
                    >
                      <Ionicons name="add" size={20} color="#1e293b" />
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </View>

          {/* Big Action Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
            onPress={handleSaveMirage}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.saveBtnText}>Valider le Mirage du Chariot</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  fullCamera: {
    flex: 1,
    position: 'relative',
  },
  mirageForm: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mirageFormContent: {
    padding: 16,
    paddingBottom: 40,
  },
  chariotBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  bannerSuper: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  bannerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 3,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBtnText: {
    color: '#4f46e5',
    fontSize: 11,
    fontWeight: '800',
  },
  kpiStrip: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  plateauxList: {
    gap: 8,
    marginBottom: 20,
  },
  plateauCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  plateauLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  plateauBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateauBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  tauxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  stepValueBox: {
    width: 48,
    alignItems: 'center',
  },
  stepValueText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  stepValueSub: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
})
