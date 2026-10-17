import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useCameraPermissions } from 'expo-camera'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import Header from './src/components/Header'
import ScanIdentifyScreen from './src/screens/ScanIdentifyScreen'
import ModeIncubationScreen from './src/screens/ModeIncubationScreen'
import ModeMirageScreen from './src/screens/ModeMirageScreen'
import SyncOfflineScreen from './src/screens/SyncOfflineScreen'
import { SUPABASE_URL } from './src/config/supabase'

export default function App() {
  const [permission, requestPermission] = useCameraPermissions()
  const [activeTab, setActiveTab] = useState('identify')
  const [isOnline, setIsOnline] = useState(true)
  const [passedChariot, setPassedChariot] = useState(null)

  // Check network liveness against Supabase health endpoint
  const checkNetwork = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: { apikey: 'test' },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      setIsOnline(true)
    } catch (e) {
      setIsOnline(false)
    }
  }

  useEffect(() => {
    checkNetwork()
    const interval = setInterval(checkNetwork, 15000)
    return () => clearInterval(interval)
  }, [])

  // Camera Permission Handling
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <MaterialCommunityIcons name="camera-lock" size={48} color="#4f46e5" />
          </View>
          <Text style={styles.permissionTitle}>Accès Caméra Requis</Text>
          <Text style={styles.permissionDesc}>
            L'application Hatchery Scanner a besoin d'accéder à l'appareil photo de votre téléphone pour scanner les codes-barres métalliques des chariots.
          </Text>

          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Autoriser la Caméra</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Quick navigation handlers between modes
  const handleNavigateToIncubation = (chariotNumber) => {
    setPassedChariot(chariotNumber)
    setActiveTab('incubation')
  }

  const handleNavigateToMirage = (chariotDetails) => {
    setPassedChariot(chariotDetails)
    setActiveTab('mirage')
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" />

      {/* Top Universal Header */}
      <Header
        title="Hatchery Scanner"
        subtitle="Mise en incubation & Mirage mobile"
        isOnline={isOnline}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setPassedChariot(null)
          setActiveTab(tab)
        }}
      />

      {/* Tab Screen Rendering */}
      <View style={styles.body}>
        {activeTab === 'identify' && (
          <ScanIdentifyScreen
            onNavigateToIncubation={handleNavigateToIncubation}
            onNavigateToMirage={handleNavigateToMirage}
          />
        )}

        {activeTab === 'incubation' && (
          <ModeIncubationScreen
            initialChariot={typeof passedChariot === 'string' ? passedChariot : null}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'mirage' && (
          <ModeMirageScreen
            initialChariot={typeof passedChariot === 'object' ? passedChariot : null}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'offline' && (
          <SyncOfflineScreen
            isOnline={isOnline}
            onRefreshStatus={checkNetwork}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  body: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
})
