import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width: W } = Dimensions.get('window');
const AVATAR_SIZE = W * 0.28;

const menuItems = [
  { icon: 'settings-outline', label: 'Settings' },
  { icon: 'create-outline', label: 'Edit Profile' },
  { icon: 'shield-checkmark-outline', label: 'Privacy' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
];

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.headerWrap}>
        <BlurView intensity={40} tint="dark" style={[styles.header, { overflow: 'hidden' }]}>
          <Text style={styles.headerText}>Profile</Text>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={[COLORS.maroon, COLORS.burgundy]}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={AVATAR_SIZE * 0.4} color={COLORS.taupe} />
            </View>
          </LinearGradient>
          <Text style={styles.name}>John Doe, 26</Text>
          <Text style={styles.job}>Software Engineer</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Likes', value: '24' },
              { label: 'Matches', value: '12' },
              { label: 'Chats', value: '8' },
            ].map((stat, i) => (
              <BlurView key={i} intensity={30} tint="dark" style={[styles.statCard, { overflow: 'hidden' }]}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </BlurView>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} activeOpacity={0.7}>
              <BlurView intensity={25} tint="dark" style={[styles.menuItem, { overflow: 'hidden' }]}>
                <Ionicons name={item.icon} size={W * 0.055} color={COLORS.cream} />
                <Text style={styles.menuText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={W * 0.045} color={COLORS.taupe} />
              </BlurView>
            </TouchableOpacity>
          ))}

          {/* Sign Out */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => signOut()}>
            <LinearGradient
              colors={[COLORS.maroon + '80', COLORS.burgundy + '80']}
              style={styles.signOutBtn}
            >
              <Ionicons name="log-out-outline" size={W * 0.055} color="#FF6B6B" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  headerWrap: { paddingTop: Platform.OS === 'ios' ? 54 : 40, paddingHorizontal: W * 0.04 },
  header: {
    borderRadius: W * 0.04, padding: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  headerText: { fontSize: W * 0.065, fontWeight: 'bold', color: '#fff' },
  scrollContent: { paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: 'center', marginTop: W * 0.06 },
  avatarRing: {
    width: AVATAR_SIZE + 6, height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2, justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#1a0a0e', justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: W * 0.06, fontWeight: 'bold', color: '#fff', marginTop: W * 0.04 },
  job: { fontSize: W * 0.038, color: COLORS.taupe, marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: W * 0.03,
    marginTop: W * 0.06, paddingHorizontal: W * 0.04,
  },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: W * 0.04,
    borderRadius: W * 0.04, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: { fontSize: W * 0.055, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: W * 0.03, color: COLORS.taupe, marginTop: 4 },

  // Menu
  menuSection: { paddingHorizontal: W * 0.04, marginTop: W * 0.06, gap: W * 0.025 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: W * 0.04, borderRadius: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  menuText: {
    flex: 1, fontSize: W * 0.04, fontWeight: '600', color: '#fff', marginLeft: W * 0.04,
  },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: W * 0.04, borderRadius: W * 0.04, gap: W * 0.03, marginTop: W * 0.02,
    borderWidth: 1, borderColor: 'rgba(255,100,100,0.2)',
  },
  signOutText: { fontSize: W * 0.04, fontWeight: '700', color: '#FF6B6B' },
});
