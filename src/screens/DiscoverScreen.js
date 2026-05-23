import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, Modal, StatusBar, Platform, Animated, PanResponder, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const SWIPE_THRESHOLD = W * 0.3;

const PROFILES = [
  {
    id: '1', name: 'Ananya', age: 24, gender: 'Female', zodiac: 'Gemini', relationshipType: 'Long-term',
    job: 'UX Designer', education: 'NID Ahmedabad',
    hometown: 'Mumbai', height: "5'6\"", weight: "55",
    photos: [
      require('../../assets/profile1.png'),
      require('../../assets/profile2.png'),
      require('../../assets/profile3.png'),
      
    ],
    bio: 'Sunset hikes, masala chai, and deep conversations about the universe ✨',
    music: 'Indie', movies: 'Sci-Fi', date: 'Museum date and coffee', food: 'Sushi',
  },
  {
    id: '2', name: 'Arjun', age: 27, gender: 'Male', zodiac: 'Leo', relationshipType: 'Short-term',
    job: 'Software Engineer', education: 'IIT Delhi',
    hometown: 'Bangalore', height: "5'11\"", weight: "75",
    photos: [
      require('../../assets/profile2.png'),
      require('../../assets/profile3.png'),
      require('../../assets/profile1.png')
    ],
    bio: 'Morning runs, vinyl records, and perfectly brewed pour-over coffee ☕',
    music: 'Rock', movies: 'Action', date: 'Live band performance', food: 'Italian',
  },
  {
    id: '3', name: 'Priya', age: 23, gender: 'Female', zodiac: 'Libra', relationshipType: 'Still exploring',
    job: 'Marketing Lead', education: "St. Xavier's College",
    hometown: 'Delhi', height: "5'4\"", weight: "50",
    photos: [
      require('../../assets/profile3.png'),
      require('../../assets/profile1.png'),
      require('../../assets/profile2.png')
    ],
    bio: 'Spontaneous road trips, sharing desserts, and never skipping the aux cord 🎵',
    music: 'Pop', movies: 'Comedy', date: 'Late night drive', food: 'Desserts',
  },
  {
    id: '4', name: 'Yogesh', age: 22, gender: 'male', zodiac: 'Gemini', relationshipType: 'Long-term',
    job: 'UX Designer', education: 'NID Ahmedabad',
    hometown: 'Mumbai', height: "5'6\"", weight: "55",
    photos: [
      
      require('../../assets/profile5.jpeg'),
      require('../../assets/profile6.jpeg'),
      require('../../assets/profile7.jpeg'),
    
      
    ],
    bio: 'Sunrise hikes, sutta chai, and funny conversations',
    music: 'Indie', movies: 'Sci-Fi', date: 'Museum date and coffee', food: 'Sushi',
  },
];

const SwipeCard = ({ profile, isTop, onSwipeComplete, nextProfile }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const cardScale = useRef(new Animated.Value(isTop ? 1 : 0.92)).current;
  const cardOpacity = useRef(new Animated.Value(isTop ? 1 : 0.7)).current;

  React.useEffect(() => {
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
        // Only set pan responder for horizontal swipes (threshold > 10)
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
          <Image source={profile.photos[0]} style={styles.cardImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)', '#1a0a0e']} locations={[0.4, 0.8, 1]} style={styles.cardGradient} />
          <View style={styles.cardContent}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{profile.name}, {profile.age}</Text>
              </View>
            </View>
            <Text style={styles.cardBio} numberOfLines={2}>{profile.bio}</Text>
          </View>
        </View>

        <View style={styles.innerDetailSection}>
          <View style={styles.modalPills}>
            <View style={styles.pill}><Ionicons name="male-female-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.gender}</Text></View>
            <View style={styles.pill}><Ionicons name="moon-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.zodiac}</Text></View>
            <View style={styles.pill}><Ionicons name="heart-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.relationshipType}</Text></View>
            <View style={styles.pill}><Ionicons name="location-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.hometown}</Text></View>
          </View>

          {profile.photos[1] && (
            <>
              <Image source={profile.photos[1]} style={styles.secondaryPhoto} />
              <View style={styles.modalPrompt}>
                <Text style={styles.modalQ}>Work & Education</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="briefcase-outline" size={16} color={COLORS.taupe} /><Text style={styles.modalA}> {profile.job}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="school-outline" size={16} color={COLORS.taupe} /><Text style={styles.modalA}> {profile.education}</Text></View>
              </View>
              <View style={styles.modalPills}>
                <View style={styles.pill}><Ionicons name="resize-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.height}</Text></View>
                <View style={styles.pill}><Ionicons name="barbell-outline" size={14} color="#fff" /><Text style={styles.pillText}>{profile.weight} kg</Text></View>
              </View>
            </>
          )}

          {profile.photos[2] && (
            <>
              <Image source={profile.photos[2]} style={styles.secondaryPhoto} />
              <View style={styles.modalPrompt}>
                <Text style={styles.modalQ}>Interests</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="musical-notes-outline" size={16} color={COLORS.taupe} /><Text style={styles.modalA}> {profile.music}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="film-outline" size={16} color={COLORS.taupe} /><Text style={styles.modalA}> {profile.movies}</Text></View>
              </View>
              <View style={styles.modalPrompt}>
                <Text style={styles.modalQ}>My ideal date</Text>
                <Text style={[styles.modalA, { marginTop: 8 }]}>{profile.date}</Text>
              </View>
              <View style={styles.modalPrompt}>
                <Text style={styles.modalQ}>Go-to food</Text>
                <Text style={[styles.modalA, { marginTop: 8 }]}>{profile.food}</Text>
              </View>
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

export default function DiscoverScreen() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const handleSwipe = useCallback((dir) => { setCurrentIdx(prev => prev + 1); }, []);
  const hasProfiles = currentIdx < PROFILES.length;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a0a0e', COLORS.burgundy, '#0d0507']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

      <View style={[styles.headerWrap, { paddingTop: insets.top + W * 0.03, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: W * 0.02 }]}>
        <Text style={styles.headerTitle}>Find your one</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={W * 0.055} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardStack}>
        {hasProfiles ? (
          <>
            {currentIdx + 1 < PROFILES.length && (
              <SwipeCard key={PROFILES[currentIdx + 1].id + '-b'} profile={PROFILES[currentIdx + 1]} isTop={false} nextProfile={true} onSwipeComplete={() => {}} />
            )}
            <SwipeCard key={PROFILES[currentIdx].id} profile={PROFILES[currentIdx]} isTop={true} nextProfile={false} onSwipeComplete={handleSwipe} />
          </>
        ) : (
          <BlurView intensity={50} tint="dark" style={[styles.emptyBlur, { overflow: 'hidden' }]}>
            <Ionicons name="heart-dislike-outline" size={W * 0.14} color={COLORS.taupe} />
            <Text style={styles.emptyTitle}>No more profiles</Text>
            <Text style={styles.emptySub}>Check back later for new people</Text>
            <TouchableOpacity onPress={() => setCurrentIdx(0)}>
              <LinearGradient colors={[COLORS.maroon, COLORS.burgundy]} style={styles.restartBtn}>
                <Text style={styles.restartText}>Start Over</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  headerWrap: { paddingHorizontal: W * 0.05 },
  headerTitle: { 
    fontSize: W * 0.085, 
    fontFamily: 'BricolageGrotesque_700Bold',
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
  
  emptyBlur: { borderRadius: W * 0.06, padding: W * 0.1, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: W - W * 0.16 },
  emptyTitle: { fontSize: W * 0.055, fontWeight: 'bold', color: '#fff', marginTop: W * 0.04 },
  emptySub: { fontSize: W * 0.035, color: COLORS.taupe, marginTop: W * 0.02, textAlign: 'center' },
  restartBtn: { paddingVertical: W * 0.035, paddingHorizontal: W * 0.1, borderRadius: W * 0.06, marginTop: W * 0.06 },
  restartText: { color: COLORS.cream, fontSize: W * 0.04, fontWeight: 'bold' },
});
