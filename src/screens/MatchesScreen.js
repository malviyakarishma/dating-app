import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity, Image,
  ActivityIndicator, Animated, ScrollView, Modal, TouchableWithoutFeedback, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '../theme/colors';
import * as swipeService from '../services/swipeService.js';
import * as paymentService from '../services/paymentService.js';

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

/**
 * Format remaining time into a human-readable countdown string.
 */
const formatRemainingTime = (ms) => {
  if (!ms || ms <= 0) return 'Expired';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

// ========================================================================
// UNLOCK CHAT MODAL
// ========================================================================
const UnlockChatModal = ({ visible, user, onClose, onUnlockComplete }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedPlan(null);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handlePayment = async (paymentType) => {
    if (!user) return;
    const userId = user.id || user._id;
    try {
      setLoading(true);
      setSelectedPlan(paymentType);
      const response = await paymentService.unlockChat(userId, paymentType);
      const checkoutUrl = response.data?.checkoutUrl;

      if (checkoutUrl) {
        // Open Stripe Checkout in an in-app browser
        const result = await WebBrowser.openBrowserAsync(checkoutUrl);

        // After returning from browser, check if access was granted
        if (result.type === 'cancel' || result.type === 'dismiss' || result.type === 'opened') {
          // Give webhook a moment to process
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Verify access status after payment flow
        const accessRes = await paymentService.getChatAccess(userId);
        if (accessRes.data?.hasAccess) {
          onUnlockComplete && onUnlockComplete(userId);
        }
      }
    } catch (err) {
      console.error('Payment failed:', err.message);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (!visible || !user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={unlockStyles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View style={[unlockStyles.container, {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }]}>
          {/* Header */}
          <LinearGradient
            colors={['rgba(139,92,246,0.3)', 'rgba(255,77,103,0.15)', 'transparent']}
            style={unlockStyles.headerGradient}
          />

          <TouchableOpacity style={unlockStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Lock Icon */}
          <View style={unlockStyles.iconWrap}>
            <LinearGradient
              colors={['#8B5CF6', '#FF4D67']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={unlockStyles.iconGradient}
            >
              <Ionicons name="lock-closed" size={28} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={unlockStyles.title}>Unlock Chat</Text>
          <Text style={unlockStyles.subtitle}>
            Start chatting with {user.name?.split(' ')[0] || 'your match'}
          </Text>

          {/* Plan Cards */}
          <View style={unlockStyles.plansContainer}>
            {/* One-Time */}
            <TouchableOpacity
              style={[unlockStyles.planCard, selectedPlan === 'ONE_TIME' && unlockStyles.planCardSelected]}
              onPress={() => handlePayment('ONE_TIME')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={unlockStyles.planHeader}>
                <View style={unlockStyles.planIconWrap}>
                  <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                </View>
                <View style={unlockStyles.planBadge}>
                  <Text style={unlockStyles.planBadgeText}>Popular</Text>
                </View>
              </View>
              <Text style={unlockStyles.planTitle}>One-Time Access</Text>
              <Text style={unlockStyles.planDesc}>24 hours of chat access</Text>
              <View style={unlockStyles.priceRow}>
                <Text style={unlockStyles.priceSymbol}>₹</Text>
                <Text style={unlockStyles.priceAmount}>50</Text>
                <Text style={unlockStyles.pricePeriod}>/24 hrs</Text>
              </View>
              {loading && selectedPlan === 'ONE_TIME' && (
                <ActivityIndicator size="small" color="#8B5CF6" style={{ marginTop: 8 }} />
              )}
            </TouchableOpacity>

            {/* Subscription */}
            <TouchableOpacity
              style={[unlockStyles.planCard, unlockStyles.planCardSub, selectedPlan === 'SUBSCRIPTION' && unlockStyles.planCardSelected]}
              onPress={() => handlePayment('SUBSCRIPTION')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={unlockStyles.planHeader}>
                <View style={[unlockStyles.planIconWrap, { backgroundColor: 'rgba(255,77,103,0.15)' }]}>
                  <Ionicons name="repeat-outline" size={20} color="#FF4D67" />
                </View>
                <View style={[unlockStyles.planBadge, { backgroundColor: 'rgba(255,77,103,0.15)' }]}>
                  <Text style={[unlockStyles.planBadgeText, { color: '#FF4D67' }]}>Auto</Text>
                </View>
              </View>
              <Text style={unlockStyles.planTitle}>Monthly Auto-Renew</Text>
              <Text style={unlockStyles.planDesc}>Daily renewal · Cancel anytime</Text>
              <View style={unlockStyles.priceRow}>
                <Text style={[unlockStyles.priceSymbol, { color: '#FF4D67' }]}>₹</Text>
                <Text style={[unlockStyles.priceAmount, { color: '#FF4D67' }]}>50</Text>
                <Text style={unlockStyles.pricePeriod}>/day</Text>
              </View>
              {loading && selectedPlan === 'SUBSCRIPTION' && (
                <ActivityIndicator size="small" color="#FF4D67" style={{ marginTop: 8 }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Security Note */}
          <View style={unlockStyles.securityRow}>
            <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.3)" />
            <Text style={unlockStyles.securityText}>Secured by Stripe · Payments encrypted</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

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
const ExpandedProfile = ({ item, showChat, chatAccessInfo, onHeart, onChat, onUnlockChat, onClose }) => {
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

  const hasActiveAccess = chatAccessInfo?.hasAccess;
  const isMatch = showChat; // showChat means it's a confirmed match

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
        {/* Access Status Badge */}
        {isMatch && hasActiveAccess && chatAccessInfo?.remainingTime && (
          <View style={styles.accessBadge}>
            <Ionicons name="time-outline" size={12} color="#4CCC93" />
            <Text style={styles.accessBadgeText}>
              {formatRemainingTime(chatAccessInfo.remainingTime)}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.expandedActions}>
        {/* Heart Button — for accepting requests */}
        <TouchableOpacity
          style={[styles.actionBtn, showChat && styles.actionBtnMuted]}
          activeOpacity={0.7}
          onPress={onHeart}
          disabled={showChat}
        >
          <Ionicons name="heart" size={26} color={showChat ? 'rgba(255,182,193,0.4)' : '#FF4D67'} />
        </TouchableOpacity>

        {/* Chat / Unlock Button */}
        {isMatch ? (
          chatAccessInfo?.canSend ? (
            // Active access → Chat button
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={onChat}
            >
              <Ionicons name="chatbubble-ellipses" size={26} color="#8B5CF6" />
            </TouchableOpacity>
          ) : (
            // No access → Unlock button
            <TouchableOpacity
              style={[styles.actionBtn, styles.unlockBtn]}
              activeOpacity={0.7}
              onPress={onUnlockChat}
            >
              <Ionicons name="lock-open" size={22} color="#FFD700" />
              <Text style={styles.unlockBtnPrice}>₹50</Text>
            </TouchableOpacity>
          )
        ) : (
          // Not yet a match → locked chat
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnLocked]}
            activeOpacity={0.7}
            disabled={true}
          >
            <Ionicons name="chatbubble-ellipses" size={26} color="rgba(255,255,255,0.12)" />
          </TouchableOpacity>
        )}
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
  const [unlockModalUser, setUnlockModalUser] = useState(null);
  const [chatAccessInfo, setChatAccessInfo] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

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

  // Check chat access when an item is selected and it's a match
  useEffect(() => {
    const checkAccess = async () => {
      if (selectedItem && showChat) {
        const userId = selectedItem.user?.id || selectedItem.user?._id;
        if (userId) {
          try {
            setCheckingAccess(true);
            const res = await paymentService.getChatAccess(userId);
            setChatAccessInfo(res.data || { hasAccess: false });
          } catch (err) {
            setChatAccessInfo({ hasAccess: false });
          } finally {
            setCheckingAccess(false);
          }
        }
      } else {
        setChatAccessInfo(null);
      }
    };
    checkAccess();
  }, [selectedItem, showChat]);

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
    if (showChat && selectedItem?.user && chatAccessInfo?.hasAccess) {
      setSelectedItem(null);
      navigation.navigate('ChatDM', {
        userName: selectedItem.user.name,
        otherUserId: selectedItem.user.id || selectedItem.user._id
      });
    }
  };

  const handleUnlockChat = () => {
    if (selectedItem?.user) {
      setUnlockModalUser(selectedItem.user);
    }
  };

  const handleUnlockComplete = async (userId) => {
    setUnlockModalUser(null);
    // Refresh access info
    try {
      const res = await paymentService.getChatAccess(userId);
      setChatAccessInfo(res.data || { hasAccess: false });
    } catch (err) {
      console.error('Failed to refresh access:', err);
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
          {checkingAccess ? (
            <ActivityIndicator size="large" color="#8B5CF6" />
          ) : (
            <ExpandedProfile
              item={selectedItem}
              showChat={showChat}
              chatAccessInfo={chatAccessInfo}
              onHeart={handleHeartPress}
              onChat={handleChatPress}
              onUnlockChat={handleUnlockChat}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </View>
      </Modal>

      {/* Unlock Chat Payment Modal */}
      <UnlockChatModal
        visible={!!unlockModalUser}
        user={unlockModalUser}
        onClose={() => setUnlockModalUser(null)}
        onUnlockComplete={handleUnlockComplete}
      />
    </View>
  );
}

// ========================================================================
// UNLOCK MODAL STYLES
// ========================================================================
const unlockStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: W * 0.88,
    backgroundColor: 'rgba(20, 12, 18, 0.97)',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    overflow: 'hidden',
    // Glow shadow
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
  },
  planCardSub: {
    backgroundColor: 'rgba(255,77,103,0.06)',
    borderColor: 'rgba(255,77,103,0.15)',
  },
  planCardSelected: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planBadge: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  planDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  pricePeriod: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginLeft: 4,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  securityText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
});

// ========================================================================
// MAIN STYLES
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
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: 'rgba(76,204,147,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  accessBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CCC93',
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
  unlockBtn: {
    width: 72,
    borderRadius: 28,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.25)',
    flexDirection: 'row',
    gap: 4,
  },
  unlockBtnPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
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
