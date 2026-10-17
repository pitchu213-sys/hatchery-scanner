import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native'
import { CameraView } from 'expo-camera'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import ScannerOverlay from '../components/ScannerOverlay'
import { getChariotDetails } from '../services/chariotService'
import { playScanSuccess, playScanError, playButtonPress } from '../services/soundService'

export default function ScanIdentifyScreen({ onNavigateToIncubation, onNavigateToMirage }) {
  const [torchOn, setTorchOn] = useState(false)
  const [scannedCode, setScannedCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chariotInfo, setChariotInfo] = useState(null)
  const [isScanning, setIsScanning] = useState(true)

  const handleBarcodeScanned = async ({ data }) => {
    if (!isScanning || loading) return
    setIsScanning(false)
    await processCode(data)
  }

  const handleManualSubmit = async (code) => {
    setIsScanning(false)
    await processCode(code)
  }

  const processCode = async (code) => {
    setLoading(true)
    setScannedCode(code)
    try {
      const details = await getChariotDetails(code)
      setChariotInfo(details)
      await playScanSuccess()
    } catch (e) {
      await playScanError()
    } finally {
      setLoading(false)
    }
  }

  const handleResetScan = async () => {
    await playButtonPress()
    setScannedCode(null)
    setChariotInfo(null)
    setIsScanning(true)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const p = dateStr.split('-')
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`
    return dateStr
  }

  return (
    <View style={styles.container}>
      {/* Top Camera View */}
      <View style={styles.cameraBox}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'itf14'],
          }}
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        />

        {isScanning && (
          <ScannerOverlay
            torchOn={torchOn}
            onToggleTorch={() => setTorchOn(!torchOn)}
            onManualSubmit={handleManualSubmit}
            hint="Scannez le code-barres d'un chariot pour l'identifier"
            isScanning={isScanning}
          />
        )}
      </View>

      {/* Bottom Result Card / Information Panel */}
      <View style={styles.bottomPanel}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Recherche des données du chariot...</Text>
          </View>
        ) : chariotInfo ? (
          <ScrollView contentContainerStyle={styles.detailsScroll} showsVerticalScrollIndicator={false}>
            {/* Header of Card */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardSuperTitle}>FICHE TRAÇABILITÉ</Text>
                <Text style={styles.cardTitle}>Chariot N° {chariotInfo.n_chariot}</Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: chariotInfo.statusColor + '20', borderColor: chariotInfo.statusColor }]}>
                <Text style={[styles.statusBadgeText, { color: chariotInfo.statusColor }]}>
                  {chariotInfo.statusLabel}
                </Text>
              </View>
            </View>

            {/* Info Grid */}
            {chariotInfo.found ? (
              <View style={styles.infoGrid}>
                {/* Lot & Strain */}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>LOT ROTATION</Text>
                    <Text style={styles.infoValue}>Lot {chariotInfo.lot_code}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>BÂTIMENT</Text>
                    <Text style={styles.infoValue}>{chariotInfo.batiment}</Text>
                  </View>
                </View>

                {/* Incubation & Transfert Dates */}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>DATE INCUBATION</Text>
                    <Text style={styles.infoValue}>{formatDate(chariotInfo.date_incubation)}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>DATE TRANSFERT / MIRAGE</Text>
                    <Text style={[styles.infoValue, { color: '#b45309' }]}>
                      {formatDate(chariotInfo.date_transfert)}
                    </Text>
                  </View>
                </View>

                {/* Quantities & Candling */}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>TOTAL OAC</Text>
                    <Text style={styles.infoValue}>{chariotInfo.oac_total.toLocaleString('fr-FR')} œufs</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>SESSION INCUBATION</Text>
                    <Text style={styles.infoValue}>Bon #{chariotInfo.doc_number}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="information-outline" size={36} color="#94a3b8" />
                <Text style={styles.emptyText}>
                  Ce chariot ({scannedCode}) est disponible et n'est assigné à aucune incubation active.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.rescanBtn}
                onPress={handleResetScan}
              >
                <Ionicons name="refresh" size={18} color="#475569" />
                <Text style={styles.rescanBtnText}>Re-scanner</Text>
              </TouchableOpacity>

              {chariotInfo.found && onNavigateToMirage && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onNavigateToMirage(chariotInfo)}
                >
                  <Ionicons name="flashlight" size={18} color="#ffffff" />
                  <Text style={styles.actionBtnText}>Mirage</Text>
                </TouchableOpacity>
              )}

              {!chariotInfo.found && onNavigateToIncubation && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onNavigateToIncubation(chariotInfo.n_chariot)}
                >
                  <MaterialCommunityIcons name="plus-circle" size={18} color="#ffffff" />
                  <Text style={styles.actionBtnText}>Incuber</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.idleState}>
            <MaterialCommunityIcons name="barcode-scan" size={44} color="#cbd5e1" />
            <Text style={styles.idleTitle}>Scanner prêt</Text>
            <Text style={styles.idleDesc}>
              Visez la plaque métallique de la chariot pour afficher instantanément sa fiche technique et son historique.
            </Text>
          </View>
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
  cameraBox: {
    flex: 1.1,
    position: 'relative',
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  detailsScroll: {
    paddingBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  cardSuperTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoGrid: {
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 3,
  },
  emptyBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rescanBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  rescanBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  idleState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  idleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 8,
  },
  idleDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
})
