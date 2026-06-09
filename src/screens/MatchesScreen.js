import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity, Image,
  ActivityIndicator, Animated, ScrollView, Modal, TouchableWithoutFeedback, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import * as swipeService from '../services/swipeService.js';

const { width: W, height: H } = Dimensions.get('window');
const CARD_GAP = W * 0.03;
const SIDE_PAD = W * 0.05;
const COLUMN_WIDTH = (W - SIDE_PAD * 2 - CARD_GAP) / 2;
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? H * 0.1 : H * 0.08;
const STATUS_BAR = Platform.OS === 'ios' ? H * 0.06 : H * 0.05;

// --- UTILS ---
const resolveImageSource = (photo) => {
  if (typeof photo === 'string') return { uri: photo };
  return photo;
};

// Dynamic height patterns for masonry variety (proportional to screen)
const CARD_HEIGHTS = [
  H * 0.28, H * 0.33, H * 0.26, H * 0.35, H * 0.30,
  H * 0.28, H * 0.34, H * 0.27, H * 0.32, H * 0.29,
  H * 0.36, H * 0.26,
];

// ========================================================================
// MASONRY CARD
// ========================================================================
const MasonryCard = ({ item, index, cardHeight, onPress }) => {
  const user = item.user;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const isMatch = item.type === 'match';

  return (
    <Animated.View style={{
      opacity: entranceAnim,
      transform: [{ translateY }, { scale: scaleAnim }],
      marginBottom: CARD_GAP,
    }}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
      >
        <View style={[styles.card, { height: cardHeight }]}>
          {/* Profile Image */}
          {user.photos && user.photos.length > 0 ? (
            <Image source={resolveImageSource(user.photos[0])} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.placeholderImage]}>
              <Ionicons name="person" size={50} color="rgba(255,255,255,0.08)" />
            </View>
          )}

          {/* Bottom gradient for text */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.cardGradient}
          />

          {/* Name + Date overlay */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={2}>{user.name}</Text>
            {user.date ? (
              <Text style={styles.cardDate} numberOfLines={2}>{user.date}</Text>
            ) : null}
          </View>

          {/* Inner highlight ring for depth */}
          <View style={styles.cardInnerBorder} />

          {/* Online indicator */}
          {user.isOnline && <View style={styles.onlineDot} />}

          {/* Match type badge */}
          {isMatch && (
            <View style={styles.matchBadge}>
              <Ionicons name="heart" size={10} color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ========================================================================
// EXPANDED PROFILE OVERLAY
// ========================================================================
const ExpandedProfile = ({ item, showChat, onHeart, onChat, onClose }) => {
  const user = item?.user;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [item]);

  if (!item || !user) return null;

  return (
    <Animated.View style={[styles.expandedCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      {user.photos && user.photos.length > 0 ? (
        <Image source={resolveImageSource(user.photos[0])} style={styles.expandedImage} />
      ) : (
        <View style={[styles.expandedImage, styles.placeholderImage]}>
          <Ionicons name="person" size={100} color="rgba(255,255,255,0.08)" />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Name + Date */}
      <View style={styles.expandedTextContainer}>
        <Text style={styles.expandedName}>{user.name}</Text>
        {user.date ? (
          <Text style={styles.expandedDate}>{user.date}</Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.expandedActions}>
        <TouchableOpacity
          style={[styles.actionBtn, showChat && styles.actionBtnMuted]}
          activeOpacity={0.7}
          onPress={onHeart}
          disabled={showChat}
        >
          <Ionicons name="heart" size={26} color={showChat ? 'rgba(255,182,193,0.4)' : '#FF4D67'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, !showChat && styles.actionBtnLocked]}
          activeOpacity={0.7}
          onPress={onChat}
          disabled={!showChat}
        >
          <Ionicons name="chatbubble-ellipses" size={26} color={showChat ? '#8B5CF6' : 'rgba(255,255,255,0.12)'} />
        </TouchableOpacity>
      </View>

      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <BlurView intensity={50} tint="dark" style={styles.closeBtnInner}>
          <Ionicons name="close" size={18} color="#fff" />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ========================================================================
// MAIN SCREEN
// ========================================================================
export default function MatchesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [localAcceptedIds, setLocalAcceptedIds] = useState(new Set());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, requestsRes] = await Promise.all([
        swipeService.getMatches(),
        swipeService.getRequests()
      ]);
      const m = matchesRes.data.matches || [];
      const r = requestsRes.data.requests || [];
      const combined = [
        ...r.map(req => ({ ...req, type: 'request' })),
        ...m.map(match => ({ user: match, type: 'match' }))
      ];
      setItems(combined);
    } catch (err) {
      console.error('Failed to load matches and requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  // --- Selected item logic ---
  const isRequest = selectedItem?.type === 'request';
  const isMatch = selectedItem?.type === 'match';
  const swipeId = selectedItem?.swipeId;
  const showChat = isMatch || (swipeId && localAcceptedIds.has(swipeId));

  const handleHeartPress = async () => {
    if (isRequest && !showChat) {
      try {
        await swipeService.respondToRequest(swipeId, 'accept');
        setLocalAcceptedIds(prev => new Set(prev).add(swipeId));
      } catch (err) {
        console.error('Accept failed', err);
      }
    }
  };

  const handleChatPress = () => {
    if (showChat && selectedItem?.user) {
      setSelectedItem(null);
      navigation.navigate('ChatDM', {
        userName: selectedItem.user.name,
        otherUserId: selectedItem.user.id || selectedItem.user._id
      });
    }
  };

  // --- Masonry columns ---
  const { leftColumn, rightColumn } = useMemo(() => {
    const left = [];
    const right = [];
    items.forEach((item, i) => {
      if (i % 2 === 0) left.push({ item, index: i });
      else right.push({ item, index: i });
    });
    return { leftColumn: left, rightColumn: right };
  }, [items]);

  return (
    <View style={styles.screen}>
      {/* Subtle animated gradient background */}
      <LinearGradient
        colors={['#0d0507', '#1a0a0e', '#12070a', '#0d0507']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Matches</Text>
          </View>
          {items.length > 0 && (
            <View style={styles.countChip}>
              <Ionicons name="heart" size={14} color="#FF4D67" />
              <Text style={styles.countChipText}>{items.length}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF4D67" style={{ flex: 1 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={48} color="rgba(255,77,103,0.3)" />
          </View>
          <Text style={styles.emptyText}>No matches yet</Text>
          <Text style={styles.emptySub}>
            Keep discovering new people.{'\n'}Your matches will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Two-column masonry */}
          <View style={styles.masonryRow}>
            {/* Left Column */}
            <View style={styles.masonryColumn}>
              {leftColumn.map(({ item, index }) => (
                <MasonryCard
                  key={item.user?.id || item.user?._id || `l${index}`}
                  item={item}
                  index={index}
                  cardHeight={CARD_HEIGHTS[index % CARD_HEIGHTS.length]}
                  onPress={setSelectedItem}
                />
              ))}
            </View>

            {/* Right Column (offset for stagger) */}
            <View style={[styles.masonryColumn, { marginTop: 24 }]}>
              {rightColumn.map(({ item, index }) => (
                <MasonryCard
                  key={item.user?.id || item.user?._id || `r${index}`}
                  item={item}
                  index={index}
                  cardHeight={CARD_HEIGHTS[index % CARD_HEIGHTS.length]}
                  onPress={setSelectedItem}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Expanded Profile Modal */}
      <Modal visible={!!selectedItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableWithoutFeedback onPress={() => setSelectedItem(null)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <ExpandedProfile
            item={selectedItem}
            showChat={showChat}
            onHeart={handleHeartPress}
            onChat={handleChatPress}
            onClose={() => setSelectedItem(null)}
          />
        </View>
      </Modal>
    </View>
  );
}

// ========================================================================
// STYLES
// ========================================================================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },

  // Header
  headerContainer: {
    paddingTop: STATUS_BAR,
    paddingHorizontal: SIDE_PAD,
    paddingBottom: H * 0.015,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    fontWeight: '500',
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,77,103,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.2)',
  },
  countChipText: {
    color: '#FF4D67',
    fontSize: 14,
    fontWeight: '700',
  },

  // Grid
  gridContainer: {
    paddingHorizontal: SIDE_PAD,
    paddingBottom: TAB_BAR_HEIGHT,
  },
  masonryRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  masonryColumn: {
    flex: 1,
  },

  // Card
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    // Warm rose glow
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#1a1018',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '55%',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  cardName: {
    color: '#e0d38bff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardDate: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 15,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  onlineDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CCC93',
    borderWidth: 2,
    borderColor: '#0d0507',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,77,103,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedCard: {
    width: W * 0.88,
    height: H * 0.6,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  expandedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  expandedTextContainer: {
    position: 'absolute',
    bottom: 95,
    left: 24,
    right: 24,
  },
  expandedDate: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  expandedName: {
    color: '#e0d38bff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  expandedActions: {
    position: 'absolute',
    bottom: 28,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  actionBtnMuted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  actionBtnLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  closeBtnInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,77,103,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.1)',
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
