import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'

export default function Header({ title, subtitle, isOnline = true, activeTab, onTabChange }) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="barcode-scan" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>{title || 'Hatchery Scanner'}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        {/* Online / Offline status pill */}
        <View style={[styles.statusBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
          <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
          <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
            {isOnline ? 'En ligne' : 'Hors-ligne'}
          </Text>
        </View>
      </View>

      {/* Mode navigation tabs */}
      {onTabChange && (
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'identify' && styles.activeTabButton]}
            onPress={() => onTabChange('identify')}
          >
            <Ionicons
              name="search"
              size={15}
              color={activeTab === 'identify' ? '#4f46e5' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'identify' && styles.activeTabText]}>
              Identifier
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'incubation' && styles.activeTabButton]}
            onPress={() => onTabChange('incubation')}
          >
            <MaterialCommunityIcons
              name="egg-outline"
              size={16}
              color={activeTab === 'incubation' ? '#4f46e5' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'incubation' && styles.activeTabText]}>
              Incubation
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'mirage' && styles.activeTabButton]}
            onPress={() => onTabChange('mirage')}
          >
            <Ionicons
              name="flashlight-outline"
              size={15}
              color={activeTab === 'mirage' ? '#4f46e5' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'mirage' && styles.activeTabText]}>
              Mirage
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'offline' && styles.activeTabButton]}
            onPress={() => onTabChange('offline')}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={15}
              color={activeTab === 'offline' ? '#4f46e5' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'offline' && styles.activeTabText]}>
              Sync
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a', // Dark slate header
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  onlineBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  offlineBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  onlineDot: {
    backgroundColor: '#10b981',
  },
  offlineDot: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  onlineText: {
    color: '#34d399',
  },
  offlineText: {
    color: '#fbbf24',
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#4f46e5',
  },
})
