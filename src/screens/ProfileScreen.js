import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, Image
} from 'react-native';
import * as userService from '../services/userService.js';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width: W } = Dimensions.get('window');
const AVATAR_SIZE = W * 0.28;

const menuItems = [
  { icon: 'settings-outline', label: 'Settings', route: null },
  { icon: 'create-outline', label: 'Edit Profile', route: 'EditProfile' },
  { icon: 'shield-checkmark-outline', label: 'Privacy', route: null },
  { icon: 'notifications-outline', label: 'Notifications', route: null },
  { icon: 'help-circle-outline', label: 'Help & Support', route: null },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState({ likes: 0, matches: 0, chats: 0 });

  const fetchProfileStats = async () => {
    try {
      const res = await userService.getProfile();
      if (res.data && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load profile stats:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileStats();
    });
    fetchProfileStats();
    return unsubscribe;
  }, [navigation]);

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const diff = Date.now() - new Date(dobString).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleMenuPress = (route) => {
    if (route) {
      navigation.navigate(route);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={[COLORS.maroon, COLORS.burgundy]}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              {user?.photos && user.photos.length > 0 ? (
                <Image source={{ uri: user.photos[0] }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={AVATAR_SIZE * 0.4} color={COLORS.taupe} />
              )}
            </View>
          </LinearGradient>
          <Text style={styles.name}>{user?.name}{user?.dob ? `, ${calculateAge(user.dob)}` : ''}</Text>
          <Text style={styles.job}>{user?.occupation || 'No occupation listed'}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Likes', value: stats.likes.toString() },
              { label: 'Matches', value: stats.matches.toString() },
              { label: 'Chats', value: stats.chats.toString() },
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
            <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => handleMenuPress(item.route)}>
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: W * 0.04, padding: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  scrollContent: { paddingBottom: 40, paddingTop: Platform.OS === 'ios' ? 80 : 60 },

  // Avatar
  avatarSection: { alignItems: 'center', marginTop: W * 0.06 },
  avatarRing: {
    width: AVATAR_SIZE + 6, height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2, justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#1a0a0e', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
  },
  avatarImage: { width: '100%', height: '100%' },
  name: { fontSize: W * 0.06, fontWeight: 'bold', color: '#fff', marginTop: W * 0.04 },
  job: { fontSize: W * 0.038, color: COLORS.taupe, marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: W * 0.03,
    marginTop: W * 0.06, paddingHorizontal: W * 0.04,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    flex: 1, alignItems: 'center', paddingVertical: W * 0.04,
    borderRadius: W * 0.04, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: { fontSize: W * 0.055, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: W * 0.03, color: COLORS.taupe, marginTop: 4 },

  // Menu
  menuSection: { paddingHorizontal: W * 0.04, marginTop: W * 0.06, gap: W * 0.025 },
  menuItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
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
