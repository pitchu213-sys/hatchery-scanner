import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')
const BOX_SIZE = width * 0.75

export default function ScannerOverlay({
  onManualSubmit,
  torchOn = false,
  onToggleTorch,
  hint = 'Pointez la caméra vers le code-barres du chariot',
  isScanning = true
}) {
  const [modalVisible, setModalVisible] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const handleManualConfirm = () => {
    if (manualCode.trim()) {
      onManualSubmit(manualCode.trim())
      setManualCode('')
      setModalVisible(false)
    }
  }

  return (
    <View style={styles.overlayContainer}>
      {/* Top Dimmed Layer */}
      <View style={styles.maskTop}>
        <Text style={styles.hintText}>{hint}</Text>
      </View>

      {/* Middle Row with Target Viewfinder Box */}
      <View style={styles.maskMiddle}>
        <View style={styles.maskSide} />

        {/* Viewfinder Target */}
        <View style={styles.viewfinder}>
          {/* 4 Corner Markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Aiming Laser Line */}
          {isScanning && <View style={styles.laserLine} />}
        </View>

        <View style={styles.maskSide} />
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.maskBottom}>
        <View style={styles.controlsRow}>
          {/* Torch / Flashlight Toggle */}
          <TouchableOpacity
            style={[styles.circleButton, torchOn && styles.circleButtonActive]}
            onPress={onToggleTorch}
          >
            <Ionicons
              name={torchOn ? 'flash' : 'flash-outline'}
              size={22}
              color={torchOn ? '#0f172a' : '#ffffff'}
            />
          </TouchableOpacity>

          {/* Manual Input Fallback */}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="keyboard-outline" size={20} color="#ffffff" />
            <Text style={styles.manualButtonText}>Saisir N° Manuellement</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Code Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saisie Manuelle Chariot</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Si la plaque métallique ou le code-barres est illisible, entrez directement le numéro du chariot :
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 0130000917 ou 4"
              placeholderTextColor="#94a3b8"
              value={manualCode}
              onChangeText={setManualCode}
              autoFocus={true}
              keyboardType="default"
              returnKeyType="done"
              onSubmitEditing={handleManualConfirm}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleManualConfirm}
              >
                <Text style={styles.confirmBtnText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  maskMiddle: {
    flexDirection: 'row',
    height: BOX_SIZE,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  viewfinder: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#4f46e5',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  laserLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 5,
  },
  maskBottom: {
    flex: 1.2,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#fbbf24',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    borderWidth: 1,
    borderColor: '#818cf8',
  },
  manualButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
})
