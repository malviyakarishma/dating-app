import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, Modal, StatusBar, Platform, Animated, PanResponder, ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import * as userService from '../services/userService.js';
import * as swipeService from '../services/swipeService.js';

const { width: W, height: H } = Dimensions.get('window');
const SWIPE_THRESHOLD = W * 0.3;

const resolveImageSource = (photo) => {
  if (typeof photo === 'string') {
    return { uri: photo };
  }
  return photo;
};

const SwipeCard = ({ profile, isTop, onSwipeComplete, nextProfile }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const cardScale = useRef(new Animated.Value(isTop ? 1 : 0.92)).current;
  const cardOpacity = useRef(new Animated.Value(isTop ? 1 : 0.7)).current;

  useEffect(() => {
    if (isTop) {
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(cardScale, { toValue: 0.92, duration: 200, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0.7, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [isTop]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeOff('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeOff('left');
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const swipeOff = useCallback((direction) => {
    const targetX = direction === 'right' ? W * 1.5 : -W * 1.5;
    Animated.timing(pan, {
      toValue: { x: targetX, y: -40 },
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      onSwipeComplete(direction);
    });
  }, [onSwipeComplete, pan]);

  const rotate = pan.x.interpolate({
    inputRange: [-W, 0, W],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  const likeOp = pan.x.interpolate({
    inputRange: [0, W * 0.3],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOp = pan.x.interpolate({
    inputRange: [-W * 0.3, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (!isTop && !nextProfile) return null;

  const occupationText = profile.occupation || profile.job || 'User';
  const collegeText = profile.college || profile.education || '';

  return (
    <Animated.View
      {...(isTop ? panResponder.panHandlers : {})}
      style={[
        styles.cardWrapper,
        !isTop && styles.backCard,
        {
          opacity: cardOpacity,
          transform: isTop
            ? [{ translateX: pan.x }, { translateY: pan.y }, { rotate }, { scale: cardScale }]
            : [{ scale: cardScale }],
        },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.coverPhotoWrap}>
          {profile.photos && profile.photos.length > 0 ? (
            <Image source={resolveImageSource(profile.photos[0])} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, { backgroundColor: COLORS.maroon, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={100} color="rgba(255,255,255,0.2)" />
            </View>
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)', '#1a0a0e']} locations={[0.4, 0.8, 1]} style={styles.cardGradient} />
          <View style={styles.cardContent}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{profile.name}, {profile.age || '20'}</Text>
              </View>
            </View>
            <Text style={styles.cardBio} numberOfLines={2}>{profile.bio || 'Hi! Let\'s connect.'}</Text>
          </View>
        </View>

        <View style={styles.innerDetailSection}>
          <View style={styles.modalPills}>
            <View style={styles.pill}><Ionicons name="male-female-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.gender}</Text></View>
            <View style={styles.pill}><Ionicons name="moon-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.zodiac}</Text></View>
            <View style={styles.pill}><Ionicons name="heart-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.relationshipType}</Text></View>
            <View style={styles.pill}><Ionicons name="location-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.location}</Text></View>
          </View>

          {profile.photos && profile.photos[1] && (
            <>
              <Image source={resolveImageSource(profile.photos[1])} style={styles.secondaryPhoto} />
              <View style={styles.modalPrompt}>
                <Text style={styles.modalQ}>Work & Education</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="briefcase-outline" size={16} color={COLORS.taupe} /><Text style={styles.modalA}> {occupationText}</Text></View>
                {collegeText ? <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="school-outline" size={16} color={COLORS.taupe} /><Text style={styles.modalA}> {collegeText}</Text></View> : null}
              </View>
              <View style={styles.modalPills}>
                <View style={styles.pill}><Ionicons name="resize-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.height} {profile.heightUnit || 'ft'}</Text></View>
                <View style={styles.pill}><Ionicons name="barbell-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.weight} {profile.weightUnit || 'kg'}</Text></View>
              </View>
            </>
          )}

          {profile.photos && profile.photos[2] && (
            <>
              <Image source={resolveImageSource(profile.photos[2])} style={styles.secondaryPhoto} />
              <View style={styles.modalPrompt}>
                <Text style={styles.modalQ}>Interests</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="musical-notes-outline" size={16} color={COLORS.taupe} /><Text style={styles.modalA}> {profile.music}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="film-outline" size={16} color={COLORS.taupe} /><Text style={styles.modalA}> {profile.movies}</Text></View>
              </View>
              {profile.date ? (
                <View style={styles.modalPrompt}>
                  <Text style={styles.modalQ}>My ideal date</Text>
                  <Text style={[styles.modalA, { marginTop: 8 }]}>{profile.date}</Text>
                </View>
              ) : null}
              {profile.food ? (
                <View style={styles.modalPrompt}>
                  <Text style={styles.modalQ}>Go-to food</Text>
                  <Text style={[styles.modalA, { marginTop: 8 }]}>{profile.food}</Text>
                </View>
              ) : null}
            </>
          )}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>

      {isTop && (
        <>
          <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOp }]} pointerEvents="none"><Text style={styles.stampText}>LIKE</Text></Animated.View>
          <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOp }]} pointerEvents="none"><Text style={[styles.stampText, { color: '#FF6B6B' }]}>NOPE</Text></Animated.View>
        </>
      )}
    </Animated.View>
  );
};

export default function DiscoverScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchedUser, setMatchedUser] = useState(null);
  const [isMatchModalVisible, setMatchModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  const insets = useSafeAreaInsets();
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true })
    ]).start(() => setToastMessage(null));
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await userService.getDiscovery();
      setProfiles(res.data.profiles);
      setCurrentIdx(0);
    } catch (err) {
      console.error('Failed to load discovery profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSwipe = useCallback(async (dir) => {
    const swipedProfile = profiles[currentIdx];
    if (swipedProfile) {
      const status = dir === 'right' ? 'like' : 'dislike';
      try {
        const res = await swipeService.swipe(swipedProfile.id || swipedProfile._id, status);
        if (res.data.isMatch) {
          setMatchedUser(res.data.matchedUser);
          setMatchModalVisible(true);
        } else if (status === 'like') {
          showToast(`Request sent to ${swipedProfile.name || 'user'}!`);
        }
      } catch (err) {
        console.error('Swipe action failed:', err);
      }
    }
    setCurrentIdx(prev => prev + 1);
  }, [profiles, currentIdx]);

  const hasProfiles = currentIdx < profiles.length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a0a0e', COLORS.burgundy, '#0d0507']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

      <View style={[styles.headerWrap, { paddingTop: insets.top + W * 0.03, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: W * 0.02 }]}>
        <Text style={styles.headerTitle}>Find your one</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={fetchProfiles}>
          <Ionicons name="refresh-outline" size={W * 0.055} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardStack}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF4D67" style={{ marginTop: H * 0.25 }} />
        ) : hasProfiles ? (
          <>
            {currentIdx + 1 < profiles.length && (
              <SwipeCard key={profiles[currentIdx + 1].id + '-b'} profile={profiles[currentIdx + 1]} isTop={false} nextProfile={true} onSwipeComplete={() => {}} />
            )}
            <SwipeCard key={profiles[currentIdx].id} profile={profiles[currentIdx]} isTop={true} nextProfile={false} onSwipeComplete={handleSwipe} />
          </>
        ) : (
          <BlurView intensity={50} tint="dark" style={[styles.emptyBlur, { overflow: 'hidden' }]}>
            <Ionicons name="heart-dislike-outline" size={W * 0.14} color={COLORS.taupe} />
            <Text style={styles.emptyTitle}>No more profiles</Text>
            <Text style={styles.emptySub}>Check back later for new people</Text>
            <TouchableOpacity onPress={fetchProfiles}>
              <LinearGradient colors={[COLORS.maroon, COLORS.burgundy]} style={styles.restartBtn}>
                <Text style={styles.restartText}>Refresh Feed</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        )}
      </View>

      {/* Match Overlay Modal */}
      <Modal
        visible={isMatchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={[styles.modalOverlayBlur, StyleSheet.absoluteFillObject]}>
            <LinearGradient colors={['rgba(26,10,14,0.9)', 'rgba(13,5,7,0.95)']} style={styles.matchModalWrap}>
              <Ionicons name="sparkles" size={50} color="#FFD700" style={{ marginBottom: 15 }} />
              <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
              <Text style={styles.matchSubtitle}>You and {matchedUser?.name} liked each other.</Text>

              <View style={styles.avatarRow}>
                {matchedUser?.photos && matchedUser.photos[0] ? (
                  <Image source={resolveImageSource(matchedUser.photos[0])} style={styles.matchAvatar} />
                ) : (
                  <View style={[styles.matchAvatar, { backgroundColor: COLORS.maroon, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={40} color="#fff" />
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  setMatchModalVisible(false);
                  navigation.navigate('ChatDM', {
                    userName: matchedUser?.name,
                    otherUserId: matchedUser?.id || matchedUser?._id,
                  });
                }}
                activeOpacity={0.8}
                style={{ width: '100%', marginBottom: 12 }}
              >
                <LinearGradient colors={[COLORS.maroon, COLORS.burgundy]} style={styles.matchBtn}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.matchBtnText}>Send Message</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMatchModalVisible(false)}
                activeOpacity={0.8}
                style={styles.keepSwipingBtn}
              >
                <Text style={styles.keepSwipingText}>Keep Swiping</Text>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>

      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, bottom: insets.bottom + 85 }]}>
          <BlurView intensity={80} tint="dark" style={styles.toastBlur}>
            <LinearGradient
              colors={['rgba(255, 77, 103, 0.2)', 'rgba(194, 24, 91, 0.15)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="heart" size={18} color="#FF4D67" style={{ marginRight: 8 }} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  headerWrap: { paddingHorizontal: W * 0.05 },
  headerTitle: { 
    fontSize: W * 0.085, 
    fontWeight: 'bold',
    color: '#ffffff', 
  },
  filterBtn: { padding: W * 0.025, borderRadius: W * 0.03, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' },
  cardStack: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: W * 0.04, paddingTop: W * 0.03 },
  cardWrapper: { 
    position: 'absolute', 
    top: W * 0.02, 
    bottom: W * 0.02, 
    left: W * 0.04, 
    right: W * 0.04, 
    borderRadius: W * 0.06, 
    overflow: 'hidden', 
    backgroundColor: '#1a0a0e', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 16, 
    elevation: 10 
  },
  backCard: { zIndex: 0 },
  
  coverPhotoWrap: { width: '100%', height: H * 0.76, position: 'relative' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  
  cardContent: { position: 'absolute', bottom: H * 0.05, left: 0, right: 0, paddingHorizontal: W * 0.05 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  cardName: { fontSize: W * 0.08, fontWeight: 'bold', color: '#fff' },
  cardBio: { fontSize: W * 0.04, color: 'rgba(255,255,255,0.8)', marginTop: W * 0.02, lineHeight: W * 0.055 },

  innerDetailSection: { padding: W * 0.05, backgroundColor: '#1a0a0e' },
  secondaryPhoto: { width: '100%', height: W - W * 0.1, borderRadius: 24, marginBottom: W * 0.05, resizeMode: 'cover', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },

  stamp: { position: 'absolute', top: H * 0.06, zIndex: 10, paddingHorizontal: W * 0.035, paddingVertical: W * 0.015, borderWidth: 3, borderRadius: W * 0.02 },
  likeStamp: { left: W * 0.05, borderColor: '#4CCC93', transform: [{ rotate: '-15deg' }] },
  nopeStamp: { right: W * 0.05, borderColor: '#FF6B6B', transform: [{ rotate: '15deg' }] },
  stampText: { fontSize: W * 0.07, fontWeight: '900', color: '#4CCC93', letterSpacing: 2 },
  
  modalPills: { flexDirection: 'row', flexWrap: 'wrap', gap: W * 0.02, marginBottom: W * 0.05 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: W * 0.03, paddingVertical: W * 0.02, borderRadius: W * 0.025, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pillText: { color: '#fff', fontSize: W * 0.032, marginLeft: W * 0.015, fontWeight: '500' },
  modalPrompt: { marginBottom: W * 0.04, backgroundColor: 'rgba(255,255,255,0.06)', padding: W * 0.04, borderRadius: W * 0.035, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalQ: { fontSize: W * 0.03, fontWeight: '700', color: '#FF4D67', textTransform: 'uppercase', letterSpacing: 1 },
  modalA: { fontSize: W * 0.04, color: '#fff', fontWeight: '500' },
  
  emptyBlur: { borderRadius: W * 0.06, padding: W * 0.1, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: W - W * 0.16, marginTop: H * 0.1 },
  emptyTitle: { fontSize: W * 0.055, fontWeight: 'bold', color: '#fff', marginTop: W * 0.04 },
  emptySub: { fontSize: W * 0.035, color: COLORS.taupe, marginTop: W * 0.02, textAlign: 'center' },
  restartBtn: { paddingVertical: W * 0.035, paddingHorizontal: W * 0.1, borderRadius: W * 0.06, marginTop: W * 0.06 },
  restartText: { color: COLORS.cream, fontSize: W * 0.04, fontWeight: 'bold' },

  // Match Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalOverlayBlur: { justifyContent: 'center', alignItems: 'center' },
  matchModalWrap: { width: W * 0.85, padding: W * 0.08, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  matchTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  matchSubtitle: { fontSize: 14, color: COLORS.taupe, textAlign: 'center', marginBottom: 20 },
  avatarRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  matchAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#FF4D67' },
  matchBtn: { paddingVertical: 14, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  matchBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  keepSwipingBtn: { paddingVertical: 12, alignItems: 'center' },
  keepSwipingText: { color: COLORS.taupe, fontSize: 14, fontWeight: '600' },
  toastContainer: {
    position: 'absolute',
    left: W * 0.08,
    right: W * 0.08,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.35)',
    overflow: 'hidden',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
