import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const { width: W } = Dimensions.get('window');
const AVATAR_SIZE = W * 0.4;

const PREMIUM_ACTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'create-outline', label: 'Edit Profile', route: 'EditProfile' },
      { icon: 'checkmark-circle-outline', label: 'Verification', route: null },
      { icon: 'star-outline', label: 'Premium Membership', route: null, highlight: true },]
  },
  {
    title: 'Privacy & Safety',
    items: [
      { icon: 'shield-half-outline', label: 'Privacy Settings', route: null },
      { icon: 'ban-outline', label: 'Blocked Users', route: null },
      { icon: 'lock-closed-outline', label: 'Security', route: null },
    ]
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', route: 'HelpCentre' },
      { icon: 'warning-outline', label: 'Report a Problem', route: null },
    ]
  }
];



const calculateAge = (dobString) => {
  if (!dobString) return '';
  const diff = Date.now() - new Date(dobString).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const calculateProfileCompletion = (user) => {
  if (!user) return 0;
  const fields = ['photos', 'bio', 'zodiac', 'occupation', 'location', 'music', 'movies', 'date', 'food', 'relationshipType'];
  let filled = 0;
  fields.forEach(f => {
    if (user[f] && (Array.isArray(user[f]) ? user[f].length > 0 : String(user[f]).trim() !== '')) {
      filled++;
    }
  });
  return Math.round((filled / fields.length) * 100);
};

const CircularProgress = ({ size, strokeWidth, percentage, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle stroke="rgba(255,255,255,0.1)" fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <Circle
          stroke={color} fill="none" cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth} strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ color: '#fff', fontSize: size * 0.25, fontWeight: 'bold' }}>{percentage}%</Text>
    </View>
  );
};

const Chip = ({ icon, label }) => {
  if (!label) return null;
  return (
    <View style={styles.chip}>
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      <Ionicons name={icon} size={16} color={COLORS.pinkHighlight} style={{ marginRight: 6 }} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

  const handleMenuPress = (item) => {
    if (item.route) {
      navigation.navigate(item.route);
    }
  };



  const profileCompletion = useMemo(() => calculateProfileCompletion(user), [user]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={[COLORS.pinkHighlight, COLORS.maroon]} style={styles.avatarGlow} />
            <View style={styles.avatarInner}>
              {user?.photos && user.photos.length > 0 ? (
                <Image source={{ uri: user.photos[0] }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={AVATAR_SIZE * 0.4} color={COLORS.taupe} />
              )}
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#00C2FF" />
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{user?.name}{user?.dob ? `, ${calculateAge(user.dob)}` : ''}</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.jobLocation}>
            {user?.occupation || 'Add Occupation'} • {user?.location || 'Add Location'}
          </Text>
        </Animated.View>

        {/* Profile Strength Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.completionCardWrap}>
          <BlurView intensity={30} tint="dark" style={styles.completionCard}>
            <CircularProgress size={W * 0.18} strokeWidth={6} percentage={profileCompletion} color={COLORS.pinkHighlight} />
            <View style={styles.completionTextWrap}>
              <Text style={styles.completionTitle}>Profile Strength</Text>
              <Text style={styles.completionDesc}>
                {profileCompletion < 100
                  ? "Complete your profile to get more meaningful matches and boost visibility."
                  : "Your profile is looking great! You're ready to make great connections."}
              </Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Quick Personality Cards (Horizontal Scroll) */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.chipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: W * 0.05, gap: 12 }}>
            <Chip icon="moon-outline" label={user?.zodiac} />
            <Chip icon="heart-outline" label={user?.relationshipType} />
            <Chip icon="musical-notes-outline" label={user?.music} />
            <Chip icon="school-outline" label={user?.college} />
            <Chip icon="earth-outline" label="English, Spanish" />
          </ScrollView>
        </Animated.View>

        {/* About Me Preview */}
        {user?.bio ? (
          <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <BlurView intensity={25} tint="dark" style={styles.bioCard}>
              <Text style={styles.bioText} numberOfLines={3}>{user.bio}</Text>
              <TouchableOpacity activeOpacity={0.7} style={styles.readMoreBtn}>
                <Text style={styles.readMoreText}>Read full bio</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        ) : null}

        {/* Photo Gallery Preview */}
        {user?.photos && user.photos.length > 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.galleryPreviewSection}>
            <Text style={styles.sectionTitle}>Your Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: W * 0.05, gap: 12 }}>
              {user.photos.map((uri, index) => (
                <View key={index} style={styles.galleryImageWrap}>
                  <Image source={{ uri }} style={styles.galleryImage} />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Grouped Premium Actions */}
        <View style={styles.settingsContainer}>
          {PREMIUM_ACTIONS.map((group, groupIndex) => (
            <Animated.View entering={FadeInDown.duration(600).delay(400 + (groupIndex * 100))} key={groupIndex} style={styles.settingsGroup}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.groupCardWrap}>
                <BlurView intensity={25} tint="dark" style={styles.groupCard}>
                  {group.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={itemIndex}
                      activeOpacity={0.7}
                      onPress={() => handleMenuPress(item)}
                      style={[
                        styles.menuItem,
                        itemIndex < group.items.length - 1 && styles.menuItemBorder
                      ]}
                    >
                      <View style={[styles.menuIconWrap, item.highlight && { backgroundColor: 'rgba(255, 77, 103, 0.15)' }]}>
                        <Ionicons name={item.icon} size={20} color={item.highlight ? COLORS.pinkHighlight : COLORS.cream} />
                      </View>
                      <Text style={[styles.menuText, item.highlight && { color: COLORS.pinkHighlight, fontWeight: '700' }]}>{item.label}</Text>
                      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  ))}
                </BlurView>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Sign Out Button */}
        <Animated.View entering={FadeInDown.duration(600).delay(800)} style={styles.signOutContainer}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => signOut()}>
            <LinearGradient
              colors={['rgba(255, 77, 103, 0.15)', 'rgba(26, 10, 14, 0.8)']}
              style={styles.signOutBtn}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF4D67" style={{ marginRight: 12 }} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  scrollContent: { paddingBottom: 140, paddingTop: Platform.OS === 'ios' ? 70 : 50 },

  // Hero Avatar
  heroSection: { alignItems: 'center', marginBottom: W * 0.08 },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    opacity: 0.8,
  },
  avatarInner: {
    width: '100%', height: '100%',
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#1a0a0e',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#0d0507',
  },
  avatarImage: { width: '100%', height: '100%' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0, right: 0,
    backgroundColor: '#0d0507',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0d0507',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  onlineDot: {
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF66',
    marginLeft: 8,
    shadowColor: '#00FF66',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  jobLocation: { fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Completion Card
  completionCardWrap: { paddingHorizontal: W * 0.05, marginBottom: W * 0.06 },
  completionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  completionTextWrap: { flex: 1, marginLeft: 20 },
  completionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  completionDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 },

  // Chips
  chipsSection: { marginBottom: W * 0.08 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },

  // Gallery
  galleryPreviewSection: { marginBottom: W * 0.08 },
  sectionTitle: { paddingHorizontal: W * 0.05, color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  galleryImageWrap: {
    width: W * 0.28,
    height: W * 0.38,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  galleryImage: { width: '100%', height: '100%' },

  // About Me
  aboutSection: { marginBottom: W * 0.08, paddingHorizontal: W * 0.05 },
  bioCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  bioText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  readMoreBtn: { marginTop: 12 },
  readMoreText: { color: COLORS.pinkHighlight, fontSize: 14, fontWeight: '600' },

  // Grouped Settings
  settingsContainer: { paddingHorizontal: W * 0.05 },
  settingsGroup: { marginBottom: 24 },
  groupTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  groupCardWrap: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  groupCard: { paddingHorizontal: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuIconWrap: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  menuText: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '500' },

  // Sign Out
  signOutContainer: { paddingHorizontal: W * 0.05, marginTop: 10 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.3)',
  },
  signOutText: { color: '#FF4D67', fontSize: 16, fontWeight: '700' },

});
