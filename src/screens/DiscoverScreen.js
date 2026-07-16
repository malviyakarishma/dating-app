import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, Modal, StatusBar, Platform, Animated, PanResponder, ActivityIndicator,
  LayoutAnimation, UIManager, ScrollView, Easing
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import * as userService from '../services/userService.js';
import * as swipeService from '../services/swipeService.js';

const { width: W, height: H } = Dimensions.get('window');
const SWIPE_THRESHOLD = W * 0.3;
const CARD_BORDER_RADIUS = 28;

const resolveImageSource = (photo) => {
  if (typeof photo === 'string') {
    return { uri: photo };
  }
  return photo;
};

/* ──────────────────────────────────────────────
   Interest tag pill
   ────────────────────────────────────────────── */
const ZODIAC_SIGNS = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

const INTEREST_ICONS = {
  Sport: '🔥',
  Architecture: '🏛️',
  Design: '🔥',
  Music: '🎧',
  Travel: '✈️',
  Food: '🍕',
  Fitness: '💪',
  Art: '🎨',
  Photography: '📷',
  Movies: '🎬',
  Reading: '📚',
  Gaming: '🎮',
  Dancing: '💃',
  Cooking: '🍳',
  Yoga: '🧘',
  Swimming: '🏊',
  Hiking: '🥾',
  Technology: '💻',
  Fashion: '👗',
  Nature: '🌿',
};

const InterestTag = ({ label, onPress, isActive, showDot = true }) => {
  const icon = INTEREST_ICONS[label] || '✨';
  const neonColor = ACCENT_COLORS[label] || '#ffffff';
  const Container = onPress ? TouchableOpacity : View;
  return (
    <View style={{ position: 'relative' }}>
      <Container
        onPress={onPress ? () => onPress(label) : undefined}
        activeOpacity={0.7}
        style={{ borderRadius: 20, overflow: 'hidden' }}
      >
        <BlurView
          intensity={40}
          tint="light"
          style={[
            s.interestTag,
            isActive && s.interestTagActive
          ]}
        >
          <Text style={s.interestIcon}>{icon}</Text>
        </BlurView>
      </Container>
      {showDot && <View style={[s.neonDot, { backgroundColor: neonColor, shadowColor: neonColor }]} />}
    </View>
  );
};

/* ──────────────────────────────────────────────
   Bottom arc avatar — real users from DB
   Each avatar position is computed in an arc
   ────────────────────────────────────────────── */
const ITEM_WIDTH = 74;

const BottomArcAvatar = ({ profile, index, scrollX, onPress }) => {
  const photo =
    profile.photos && profile.photos.length > 0
      ? resolveImageSource(profile.photos[0])
      : null;
  const name = profile.name
    ? `@${profile.name.toLowerCase().replace(/\s+/g, '')}`
    : '@user';

  const centerPosition = index * ITEM_WIDTH;

  const inputRange = [
    centerPosition - ITEM_WIDTH * 2,
    centerPosition - ITEM_WIDTH,
    centerPosition,
    centerPosition + ITEM_WIDTH,
    centerPosition + ITEM_WIDTH * 2,
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [42 / 66, 50 / 66, 1, 50 / 66, 42 / 66],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [24, 12, 0, 12, 24],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange: [
      centerPosition - ITEM_WIDTH * 3,
      centerPosition - ITEM_WIDTH * 2,
      centerPosition + ITEM_WIDTH * 2,
      centerPosition + ITEM_WIDTH * 3,
    ],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        s.arcItem,
        {
          width: ITEM_WIDTH,
          marginHorizontal: 0,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onPress && onPress(profile)}
        style={{ alignItems: 'center' }}
      >
        <LinearGradient
          colors={['#C084FC', '#8B5CF6', '#6D28D9']}
          style={[
            s.arcRing,
            {
              width: 66,
              height: 66,
              borderRadius: 33,
              padding: 2.5,
            },
          ]}
        >
          <View
            style={[
              s.arcAvatarInner,
              {
                width: 57,
                height: 57,
                borderRadius: 28.5,
              },
            ]}
          >
            {photo ? (
              <Image
                source={photo}
                style={{
                  width: 57,
                  height: 57,
                  borderRadius: 28.5,
                }}
              />
            ) : (
              <View
                style={[
                  s.arcAvatarFallback,
                  {
                    width: 57,
                    height: 57,
                    borderRadius: 28.5,
                  },
                ]}
              >
                <Ionicons name="person" size={22} color="rgba(255,255,255,0.4)" />
              </View>
            )}
          </View>
        </LinearGradient>
        <Text style={[s.arcName, s.arcNameCenter]} numberOfLines={1}>
          {name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ──────────────────────────────────────────────
   Photo indicator bars at top of card (tappable)
   ────────────────────────────────────────────── */
const PhotoIndicators = ({ count, activeIndex, onTap }) => (
  <View style={s.indicatorRow}>
    {Array.from({ length: count }).map((_, i) => (
      <TouchableOpacity
        key={i}
        activeOpacity={0.7}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onTap && onTap(i);
        }}
        style={[
          s.indicator,
          i === activeIndex ? s.indicatorActive : s.indicatorInactive,
        ]}
      />
    ))}
  </View>
);

/* ──────────────────────────────────────────────
   Cinematic Metadata Reveal
   ────────────────────────────────────────────── */
const ACCENT_COLORS = {
  Music: '#C084FC',
  Movies: '#E50914',
  Food: '#F59E0B',
  Zodiac: '#3B82F6'
};

const MetadataReveal = ({ detail }) => {
  const [displayDetail, setDisplayDetail] = useState(detail);
  const lineScaleY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (!detail && !displayDetail) return;

    const animateIn = (newDetail) => {
      setDisplayDetail(newDetail);
      textTranslateX.setValue(15);
      Animated.sequence([
        Animated.timing(lineScaleY, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.parallel([
          Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(textTranslateX, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.ease) })
        ])
      ]).start();
    };

    const animateOut = (callback) => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(textOpacity, { toValue: 0, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(textTranslateX, { toValue: -10, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.ease) })
        ]),
        Animated.timing(lineScaleY, { toValue: 0, duration: 250, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ]).start(() => {
        if (callback) callback();
      });
    };

    if (!detail && displayDetail) {
      animateOut(() => setDisplayDetail(null));
      return;
    }

    if (detail && displayDetail && detail.label === displayDetail.label) return;

    if (detail && displayDetail && detail.label !== displayDetail.label) {
      animateOut(() => animateIn(detail));
      return;
    }

    if (detail && !displayDetail) {
      animateIn(detail);
    }
  }, [detail]);

  if (!displayDetail) return null;

  const accentColor = ACCENT_COLORS[displayDetail.label] || '#ffffff';

  return (
    <View style={s.metadataContainer} pointerEvents="none">
      <Animated.View
        style={[
          s.metadataLine,
          {
            backgroundColor: accentColor,
            shadowColor: accentColor,
            transform: [{ scaleY: lineScaleY }]
          }
        ]}
      />
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateX: textTranslateX }] }}>
        <Text style={s.metadataLabel}>{displayDetail.label.toUpperCase()}</Text>
        <Text style={s.metadataText}>{displayDetail.text}</Text>
      </Animated.View>
    </View>
  );
};

/* ──────────────────────────────────────────────
   Main swipeable card
   ────────────────────────────────────────────── */
const SwipeCard = ({
  profile,
  isTop,
  onSwipeComplete,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const cardScale = useRef(new Animated.Value(isTop ? 1 : 0.92)).current;
  const cardOpacity = useRef(new Animated.Value(isTop ? 1 : 0)).current;
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [viewedTags, setViewedTags] = useState([]);

  const [activeDetail, setActiveDetail] = useState(null);
  const hideDetailTimeout = useRef(null);

  useEffect(() => {
    if (isTop) {
      let initialDetail = null;
      if (profile.music) initialDetail = { label: 'Music', text: profile.music };
      else if (profile.movies) initialDetail = { label: 'Movies', text: profile.movies };
      else if (profile.food) initialDetail = { label: 'Food', text: profile.food };

      if (initialDetail) {
        setActiveDetail(initialDetail);
        if (hideDetailTimeout.current) clearTimeout(hideDetailTimeout.current);
        hideDetailTimeout.current = setTimeout(() => {
          setActiveDetail(null);
        }, 5000);
      } else {
        setActiveDetail(null);
      }
    }
  }, [isTop, profile]);

  const handleInterestTap = (label) => {
    let detailText = '';
    if (label === 'Music' && profile.music) detailText = profile.music;
    else if (label === 'Movies' && profile.movies) detailText = profile.movies;
    else if (label === 'Food' && profile.food) detailText = profile.food;
    else if (label === 'Zodiac' && profile.zodiac) detailText = profile.zodiac;
    else return;

    setViewedTags((prev) => [...new Set([...prev, label])]);
    setActiveDetail({ label, text: detailText });

    if (hideDetailTimeout.current) clearTimeout(hideDetailTimeout.current);
    hideDetailTimeout.current = setTimeout(() => {
      setActiveDetail(null);
    }, 5000);
  };

  useEffect(() => {
    if (isTop) {
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(cardScale, { toValue: 0.92, duration: 200, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isTop]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 10,
      onPanResponderMove: (_, gs) => {
        pan.setValue({ x: gs.dx, y: gs.dy * 0.4 });
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          swipeOff('right');
        } else if (gs.dx < -SWIPE_THRESHOLD) {
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

  const swipeOff = useCallback(
    (direction) => {
      const targetX = direction === 'right' ? W * 1.5 : -W * 1.5;
      Animated.timing(pan, {
        toValue: { x: targetX, y: -40 },
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        onSwipeComplete(direction);
      });
    },
    [onSwipeComplete, pan]
  );

  const rotate = pan.x.interpolate({
    inputRange: [-W, 0, W],
    outputRange: ['-12deg', '0deg', '12deg'],
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



  const photoCount = profile.photos ? profile.photos.length : 0;
  const currentPhoto =
    profile.photos && profile.photos.length > 0
      ? resolveImageSource(profile.photos[activePhotoIdx] || profile.photos[0])
      : null;

  // Tap on left/right side to change photo
  const handleCardTap = (evt) => {
    if (!isTop) return;
    const touchX = evt.nativeEvent.locationX;
    if (touchX < W * 0.5) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActivePhotoIdx((prev) => Math.max(0, prev - 1));
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActivePhotoIdx((prev) =>
        Math.min(photoCount - 1, prev + 1)
      );
    }
  };

  // Build interest tags from profile data
  const interests = [];
  if (profile.interests && Array.isArray(profile.interests)) {
    interests.push(...profile.interests.slice(0, 3));
  } else {
    if (profile.music) interests.push('Music');
    if (profile.movies) interests.push('Movies');
    if (profile.food) interests.push('Food');
    if (profile.relationshipType) interests.push(profile.relationshipType);
  }
  if (interests.length === 0) {
    interests.push('Sport', 'Architecture', 'Design');
  }

  const distanceText = profile.distance
    ? `${profile.distance}`
    : `${Math.floor(Math.random() * 900 + 100)}m`;

  const zodiacDisplay = profile.zodiac ? (ZODIAC_SIGNS[profile.zodiac] || profile.zodiac) : null;

  return (
    <Animated.View
      {...(isTop ? panResponder.panHandlers : {})}
      style={[
        s.cardWrapper,
        !isTop && s.backCard,
        {
          opacity: cardOpacity,
          transform: isTop
            ? [{ translateX: pan.x }, { translateY: pan.y }, { rotate }, { scale: cardScale }]
            : [{ scale: cardScale }],
        },
      ]}
    >
      {/* Photo */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleCardTap}
        style={StyleSheet.absoluteFill}
      >
        {currentPhoto ? (
          <Image source={currentPhoto} style={s.cardImage} />
        ) : (
          <View style={[s.cardImage, s.cardImageFallback]}>
            <Ionicons name="person" size={100} color="rgba(255,255,255,0.15)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.12, 0.42, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top Left Stack: Zodiac & Interest Tags */}
      {isTop && (
        <View style={s.topLeftStack} pointerEvents="box-none">
          {zodiacDisplay && (
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => handleInterestTap('Zodiac')}
                activeOpacity={0.7}
                style={{ borderRadius: 20, overflow: 'hidden' }}
              >
                <BlurView
                  intensity={40}
                  tint="light"
                  style={[s.topZodiacContainer, activeDetail?.label === 'Zodiac' && s.interestTagActive]}
                >
                  <Text style={s.topZodiacText}>{zodiacDisplay}</Text>
                </BlurView>
              </TouchableOpacity>
              {!viewedTags.includes('Zodiac') && (
                <View style={[s.neonDot, { backgroundColor: ACCENT_COLORS['Zodiac'], shadowColor: ACCENT_COLORS['Zodiac'] }]} />
              )}
            </View>
          )}

          {/* Interest tags */}
          {interests.slice(0, 3).map((tag, i) => (
            <InterestTag
              key={i}
              label={tag}
              onPress={handleInterestTap}
              isActive={activeDetail?.label === tag}
              showDot={!viewedTags.includes(tag)}
            />
          ))}
        </View>
      )}

      {/* Like / Nope stamps */}
      {isTop && (
        <>
          <Animated.View
            style={[s.stamp, s.likeStamp, { opacity: likeOp }]}
            pointerEvents="none"
          >
            <Text style={s.stampText}>LIKE</Text>
          </Animated.View>
          <Animated.View
            style={[s.stamp, s.nopeStamp, { opacity: nopeOp }]}
            pointerEvents="none"
          >
            <Text style={[s.stampText, { color: '#FF6B6B' }]}>NOPE</Text>
          </Animated.View>
        </>
      )}

      {/* Bottom overlay content */}
      {isTop && (
        <View style={s.bottomOverlay} pointerEvents="box-none">
          {/* Distance */}
          <Text style={s.distanceText}>{distanceText}</Text>

          {/* Name, Age & Photo Indicators row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[s.cardName, { marginBottom: 0 }]}>
              {profile.name}, {''}
              <Text style={s.cardAge}>{profile.age || '24'}</Text>
            </Text>

            {photoCount >= 1 && (
              <PhotoIndicators
                count={Math.min(photoCount, 5)}
                activeIndex={activePhotoIdx}
                onTap={(i) => setActivePhotoIdx(i)}
              />
            )}
          </View>



        </View>
      )}

      {isTop && <MetadataReveal detail={activeDetail} />}
    </Animated.View>
  );
};

/* ══════════════════════════════════════════════
   MAIN SCREEN
   ══════════════════════════════════════════════ */
export default function DiscoverScreen({ navigation }) {
  const LOOP_MULTIPLIER = 100;
  const [profiles, setProfiles] = useState([]);
  const [globalIdx, setGlobalIdx] = useState(0);
  const [renderIndex, setRenderIndex] = useState(0);
  const [swipedIds, setSwipedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [matchedUser, setMatchedUser] = useState(null);
  const [isMatchModalVisible, setMatchModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const insets = useSafeAreaInsets();
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  const showToast = (message) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const lastScrollIdx = useRef(renderIndex);

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const idx = Math.round(value / ITEM_WIDTH);
      if (idx >= 0 && idx !== lastScrollIdx.current) {
        lastScrollIdx.current = idx;
        setRenderIndex(idx);
      }
    });
    return () => scrollX.removeListener(id);
  }, [scrollX]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await userService.getDiscovery();
      const loadedProfiles = res.data.profiles;
      setProfiles(loadedProfiles);
      if (loadedProfiles.length > 0) {
        const start = Math.floor(LOOP_MULTIPLIER / 2) * loadedProfiles.length;
        setGlobalIdx(start);
        setRenderIndex(start);
        scrollX.setValue(start * ITEM_WIDTH);
      }
    } catch (err) {
      console.error('Failed to load discovery profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const activeProfiles = useMemo(() => {
    return profiles.filter(p => !swipedIds.has(p.id || p._id));
  }, [profiles, swipedIds]);

  const hasProfiles = activeProfiles.length > 0;
  const loopedProfiles = useMemo(() => {
    return activeProfiles.length > 0 ? Array(LOOP_MULTIPLIER).fill(activeProfiles).flat() : [];
  }, [activeProfiles]);

  const renderAvatarItem = useCallback(({ item: p, index: idx }) => (
    <BottomArcAvatar
      profile={p}
      index={idx}
      scrollX={scrollX}
      onPress={() => handleArcProfileTap(p, idx)}
    />
  ), [scrollX, handleArcProfileTap]);

  const handleSwipe = useCallback(
    async (dir, swipedIdx) => {
      const swipedProfile = loopedProfiles[swipedIdx];
      if (swipedProfile) {
        const status = dir === 'right' ? 'like' : 'dislike';
        try {
          const res = await swipeService.swipe(
            swipedProfile.id || swipedProfile._id,
            status
          );
          if (res.data.isMatch) {
            setMatchedUser(res.data.matchedUser);
            setMatchModalVisible(true);
          } else if (status === 'like') {
            showToast(`Request sent to ${swipedProfile.name || 'user'}!`);
          }
        } catch (err) {
          console.error('Swipe action failed:', err);
        }

        // Add to swiped set — this triggers activeProfiles/loopedProfiles to recompute
        setSwipedIds(prev => {
          const next = new Set(prev);
          next.add(swipedProfile.id || swipedProfile._id);
          return next;
        });
      }

      // After recompute, the same index now points to the next profile
      // Scroll to where we are (FlatList data shrinks, so same offset = next profile)
      const startIdx = Math.floor(LOOP_MULTIPLIER / 2) * (activeProfiles.length - 1);
      setRenderIndex(startIdx);
      lastScrollIdx.current = startIdx;
      setTimeout(() => {
        scrollViewRef.current?.scrollToOffset({ offset: startIdx * ITEM_WIDTH, animated: false });
      }, 50);
    },
    [loopedProfiles, activeProfiles]
  );

  // When user taps on a bottom arc avatar, jump to that profile
  const handleArcProfileTap = useCallback(
    (tappedProfile, idx) => {
      setGlobalIdx(idx);
      scrollViewRef.current?.scrollToOffset({ offset: idx * ITEM_WIDTH, animated: true });
    },
    []
  );

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />

      {/* Card stack area — full screen */}
      <View style={s.cardStack}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#C084FC"
            style={{ marginTop: H * 0.4 }}
          />
        ) : hasProfiles ? (
          (() => {
            const currentProfile = loopedProfiles[renderIndex];
            const nextProfile = loopedProfiles[renderIndex + 1];
            if (!currentProfile) return null;
            return (
              <>
                {nextProfile && (
                  <SwipeCard
                    key={`back-${nextProfile.id || nextProfile._id}-${renderIndex + 1}`}
                    profile={nextProfile}
                    isTop={false}
                    onSwipeComplete={() => {}}
                  />
                )}
                <SwipeCard
                  key={`top-${currentProfile.id || currentProfile._id}-${renderIndex}`}
                  profile={currentProfile}
                  isTop={true}
                  onSwipeComplete={(dir) => handleSwipe(dir, renderIndex)}
                />
              </>
            );
          })()
        ) : (
          <BlurView
            intensity={50}
            tint="dark"
            style={[s.emptyBlur, { overflow: 'hidden' }]}
          >
            <Ionicons
              name="heart-dislike-outline"
              size={W * 0.14}
              color="rgba(255,255,255,0.4)"
            />
            <Text style={s.emptyTitle}>No more profiles</Text>
            <Text style={s.emptySub}>Check back later for new people</Text>
            <TouchableOpacity onPress={fetchProfiles}>
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={s.restartBtn}
              >
                <Text style={s.restartText}>Refresh Feed</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        )}
      </View>

      {/* Bottom arc of real user avatars — overlapping the card */}
      {!loading && hasProfiles && loopedProfiles.length > 0 && (
        <Animated.FlatList
          ref={scrollViewRef}
          horizontal
          data={loopedProfiles}
          keyExtractor={(p, idx) => `${p.id || p._id}-${idx}`}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          initialScrollIndex={Math.floor(LOOP_MULTIPLIER / 2) * activeProfiles.length}
          getItemLayout={(data, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          style={[
            s.arcScrollView,
            { bottom: insets.bottom + 2 },
          ]}
          contentContainerStyle={{
            paddingHorizontal: W / 2 - ITEM_WIDTH / 2,
            alignItems: 'flex-end',
          }}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          renderItem={renderAvatarItem}
        />
      )}

      {/* ─── Match Overlay Modal ─── */}
      <Modal
        visible={isMatchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMatchModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <BlurView
            intensity={80}
            tint="dark"
            style={[s.modalOverlayBlur, StyleSheet.absoluteFillObject]}
          >
            <LinearGradient
              colors={['rgba(20,10,30,0.95)', 'rgba(10,5,15,0.98)']}
              style={s.matchModalWrap}
            >
              <Ionicons
                name="sparkles"
                size={50}
                color="#C084FC"
                style={{ marginBottom: 15 }}
              />
              <Text style={s.matchTitle}>It's a Match! 🎉</Text>
              <Text style={s.matchSubtitle}>
                You and {matchedUser?.name} liked each other.
              </Text>

              <View style={s.avatarRowModal}>
                {matchedUser?.photos && matchedUser.photos[0] ? (
                  <Image
                    source={resolveImageSource(matchedUser.photos[0])}
                    style={s.matchAvatar}
                  />
                ) : (
                  <View
                    style={[
                      s.matchAvatar,
                      { backgroundColor: '#2a1a3e', justifyContent: 'center', alignItems: 'center' },
                    ]}
                  >
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
                    gender: matchedUser?.gender
                  });
                }}
                activeOpacity={0.8}
                style={{ width: '100%', marginBottom: 12 }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  style={s.matchBtn}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={s.matchBtnText}>Send Message</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMatchModalVisible(false)}
                activeOpacity={0.8}
                style={s.keepSwipingBtn}
              >
                <Text style={s.keepSwipingText}>Keep Swiping</Text>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <Animated.View
          style={[
            s.toastContainer,
            { opacity: toastOpacity, bottom: insets.bottom + 85 },
          ]}
        >
          <BlurView intensity={80} tint="dark" style={s.toastBlur}>
            <LinearGradient
              colors={[
                'rgba(139, 92, 246, 0.25)',
                'rgba(109, 40, 217, 0.15)',
              ]}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons
              name="heart"
              size={18}
              color="#C084FC"
              style={{ marginRight: 8 }}
            />
            <Text style={s.toastText}>{toastMessage}</Text>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════ */
// Bottom arc area height (avatar + label + spacing)
const ARC_ROW_HEIGHT = 115;

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c0a14',
  },

  /* ── Card Stack ── */
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 95,
    left: 0,
    right: 0,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  backCard: { zIndex: 0 },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImageFallback: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Top Section ── */
  topSection: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 38,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 5,
  },

  /* Photo indicator pills */
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: '#fff',
  },
  indicatorInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
  },

  /* ── Bottom overlay ── */
  bottomOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 14,
    zIndex: 5,
  },
  distanceText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#e0d38bff',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  cardAge: {
    fontSize: 28,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  topLeftStack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 20,
    zIndex: 90,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  topZodiacContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topZodiacText: {
    fontSize: 20,
    color: '#fff',
  },


  /* ── Interest tags ── */
  interestRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neonDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  interestIcon: {
    fontSize: 20,
  },
  interestLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  interestTagActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  /* ── Cinematic Metadata Reveal ── */
  metadataContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 64 : 44,
    right: 24,
    zIndex: 100,
    maxWidth: W * 0.55,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataLine: {
    width: 3,
    height: 30,
    borderRadius: 1.5,
    marginRight: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  metadataLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metadataText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* ── Bottom arc row (overlapping the card) ── */
  arcScrollView: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ARC_ROW_HEIGHT,
    zIndex: 20,
  },
  arcItem: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  arcRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arcAvatarInner: {
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  arcAvatarFallback: {
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arcName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 70,
  },
  arcNameCenter: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '600',
  },

  /* ── Swipe stamps ── */
  stamp: {
    position: 'absolute',
    top: H * 0.12,
    zIndex: 10,
    paddingHorizontal: W * 0.035,
    paddingVertical: W * 0.015,
    borderWidth: 3.5,
    borderRadius: 10,
  },
  likeStamp: {
    left: W * 0.08,
    borderColor: '#4CCC93',
    transform: [{ rotate: '-15deg' }],
  },
  nopeStamp: {
    right: W * 0.08,
    borderColor: '#FF6B6B',
    transform: [{ rotate: '15deg' }],
  },
  stampText: {
    fontSize: W * 0.075,
    fontWeight: '900',
    color: '#4CCC93',
    letterSpacing: 3,
  },

  /* ── Empty state ── */
  emptyBlur: {
    borderRadius: 28,
    padding: W * 0.1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: W - W * 0.16,
    marginTop: H * 0.2,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 18,
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 8,
    textAlign: 'center',
  },
  restartBtn: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 24,
    marginTop: 24,
  },
  restartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  /* ── Match Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayBlur: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModalWrap: {
    width: W * 0.85,
    padding: W * 0.08,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.2)',
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  matchSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarRowModal: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  matchAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#C084FC',
  },
  matchBtn: {
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  matchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  keepSwipingBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  keepSwipingText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '600',
  },

  /* ── Toast ── */
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
    borderColor: 'rgba(192, 132, 252, 0.35)',
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
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
