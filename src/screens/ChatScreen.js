import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity,
  ActivityIndicator, Image, TextInput, ScrollView, TouchableHighlight,
  Modal, TouchableWithoutFeedback, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '../theme/colors';
import * as chatService from '../services/chatService.js';
import * as swipeService from '../services/swipeService.js';
import * as paymentService from '../services/paymentService.js';
import * as socket from '../services/socket.js';
import { useFocusEffect } from '@react-navigation/native';

const { width: W, height: H } = Dimensions.get('window');
const AVATAR_SIZE = W * 0.16; // Slightly larger for emphasis
const STORY_SIZE = W * 0.18;
const STATUS_BAR = Platform.OS === 'ios' ? H * 0.06 : H * 0.05;

// ========================================================================
// QUICK UNLOCK MODAL (for chat screen new match bubbles)
// ========================================================================
const QuickUnlockModal = ({ visible, user, onClose, onUnlockComplete }) => {
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handlePay = async (type) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await paymentService.unlockChat(user._id, type);
      const url = res.data?.checkoutUrl;
      if (url) {
        await WebBrowser.openBrowserAsync(url);
        // Wait for webhook processing
        await new Promise(r => setTimeout(r, 2000));
        const accessRes = await paymentService.getChatAccess(user._id);
        if (accessRes.data?.hasAccess) {
          onUnlockComplete(user);
        }
      }
    } catch (err) {
      console.error('Payment error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={qStyles.overlay}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <Animated.View style={[qStyles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['rgba(139,92,246,0.2)', 'transparent']}
            style={qStyles.topGlow}
          />
          <View style={qStyles.lockIcon}>
            <Ionicons name="lock-closed" size={24} color="#8B5CF6" />
          </View>
          <Text style={qStyles.title}>Unlock chat with {user.name?.split(' ')[0]}</Text>
          <Text style={qStyles.sub}>Pay ₹50 to start messaging</Text>

          <TouchableOpacity
            style={qStyles.btn}
            onPress={() => handlePay('ONE_TIME')}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={qStyles.btnText}>One-Time · ₹50 / 24hrs</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[qStyles.btn, qStyles.btnSub]}
            onPress={() => handlePay('SUBSCRIPTION')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="repeat" size={18} color="#FF4D67" />
            <Text style={[qStyles.btnText, { color: '#FF4D67' }]}>Auto-Renew · ₹50/day</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={qStyles.cancelBtn}>
            <Text style={qStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ========================================================================
// CONVERSATION ROW
// ========================================================================
const ConversationRow = ({ item, navigation, isTyping, isLast }) => {
  const isUnread = item.unreadCount > 0;
  
  // Format Time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableHighlight
      activeOpacity={1}
      underlayColor="rgba(255,255,255,0.05)"
      onPress={() => navigation.navigate('ChatDM', { userName: item.user.name, otherUserId: item.user.id || item.user._id, gender: item.user.gender })}
    >
      <View style={styles.rowContainer}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {item.user.photos && item.user.photos.length > 0 ? (
            <Image source={{ uri: item.user.photos[0] }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={[COLORS.maroon, COLORS.burgundy]} style={styles.avatar}>
              <Text style={styles.avatarInitial}>{item.user.name[0]}</Text>
            </LinearGradient>
          )}
          {/* Online Indicator */}
          {item.user.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={[styles.rowContent, !isLast && styles.rowDivider]}>
          <View style={styles.rowHeader}>
            <Text style={[styles.rowName, isUnread && styles.rowNameUnread]}>{item.user.name}</Text>
            <View style={styles.timeWrap}>
              <Text style={[styles.rowTime, isUnread && styles.rowTimeUnread]}>
                {item.latestMessage ? formatTime(item.latestMessage.createdAt) : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.rowFooter}>
            {isTyping ? (
              <Text style={styles.typingText}>Typing...</Text>
            ) : (
              <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={1}>
                {item.latestMessage ? item.latestMessage.text : 'Start a conversation...'}
              </Text>
            )}
            
            {/* Elegant Unread Indicator */}
            {isUnread && !isTyping && <View style={styles.unreadDot} />}
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};

// ========================================================================
// MAIN SCREEN
// ========================================================================
export default function ChatScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [newMatches, setNewMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const [unlockUser, setUnlockUser] = useState(null);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const [chatsRes, matchesRes] = await Promise.all([
        chatService.getConversations(),
        swipeService.getMatches()
      ]);
      
      const activeChats = chatsRes.data?.conversations || (Array.isArray(chatsRes) ? chatsRes : []);
      setChats(activeChats);

      // Find matches that do NOT have an active conversation
      const allMatches = matchesRes.data?.matches || (Array.isArray(matchesRes) ? matchesRes : []);
      const activeChatUserIds = new Set(activeChats.map(c => c.user.id || c.user._id));
      const unstartedMatches = allMatches.filter(m => !activeChatUserIds.has(m._id));
      
      setNewMatches(unstartedMatches);

    } catch (err) {
      console.error('Failed to load messaging data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(chats.length === 0);
      socket.initSocket();

      // Setup sockets
      const handleReceiveMessage = (msg) => {
        setChats((prevChats) => {
          const updated = [...prevChats];
          const index = updated.findIndex(c => c.conversationId === msg.conversationId);
          if (index !== -1) {
            const target = { ...updated[index] };
            target.latestMessage = msg;
            if (msg.senderId !== socket.getSocket()?.user?._id) {
              target.unreadCount = (target.unreadCount || 0) + 1;
            }
            updated.splice(index, 1);
            updated.unshift(target);
          } else {
            fetchData(false);
          }
          return updated;
        });
      };

      const handleUserOnline = ({ userId }) => {
        setChats(prev => prev.map(c => (c.user.id === userId || c.user._id === userId) ? { ...c, user: { ...c.user, isOnline: true } } : c));
      };
      const handleUserOffline = ({ userId, lastSeen }) => {
        setChats(prev => prev.map(c => (c.user.id === userId || c.user._id === userId) ? { ...c, user: { ...c.user, isOnline: false, lastSeen } } : c));
      };
      const handleTypingStart = ({ conversationId }) => setTypingUsers(p => ({ ...p, [conversationId]: true }));
      const handleTypingStop = ({ conversationId }) => setTypingUsers(p => ({ ...p, [conversationId]: false }));

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('userOnline', handleUserOnline);
      socket.on('userOffline', handleUserOffline);
      socket.on('typingStart', handleTypingStart);
      socket.on('typingStop', handleTypingStop);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('userOnline', handleUserOnline);
        socket.off('userOffline', handleUserOffline);
        socket.off('typingStart', handleTypingStart);
        socket.off('typingStop', handleTypingStop);
      };
    }, [])
  );

  /**
   * When a new match bubble is tapped, check chat access first.
   * If access exists, navigate to ChatDM; if not, show unlock modal.
   */
  const handleNewMatchPress = async (match) => {
    try {
      const res = await paymentService.getChatAccess(match._id);
      if (res.data?.hasAccess) {
        navigation.navigate('ChatDM', { userName: match.name, otherUserId: match._id, gender: match.gender });
      } else {
        setUnlockUser(match);
      }
    } catch (err) {
      // If access check fails, show unlock modal as fallback
      setUnlockUser(match);
    }
  };

  const handleUnlockComplete = (user) => {
    setUnlockUser(null);
    navigation.navigate('ChatDM', { userName: user.name, otherUserId: user._id, gender: user.gender });
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0d0507', '#1a0a0e', '#12070a', '#0d0507']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerWrap}>
        <Text style={styles.heroTitle}>Messages</Text>
        <Text style={styles.heroSubtitle}>{chats.length} Active Conversations</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput 
            placeholder="Search..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF4D67" style={{ marginTop: 100 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* New Matches Row (IG Stories style) */}
          {newMatches.length > 0 && (
            <View style={styles.storiesSection}>
              <Text style={styles.sectionTitle}>New Matches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                {newMatches.map((match, i) => (
                  <TouchableOpacity 
                    key={match._id} 
                    style={styles.storyItem}
                    activeOpacity={0.8}
                    onPress={() => handleNewMatchPress(match)}
                  >
                    <View style={styles.storyAvatarWrap}>
                      <Image source={{ uri: match.photos?.[0] }} style={styles.storyAvatar} />
                      {/* Lock overlay for matches without chat access */}
                      <View style={styles.storyLockOverlay}>
                        <View style={styles.storyLockBadge}>
                          <Ionicons name="lock-closed" size={10} color="#FFD700" />
                        </View>
                      </View>
                      {match.isOnline && <View style={styles.storyOnlineDot} />}
                    </View>
                    <Text style={styles.storyName} numberOfLines={1}>{match.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Conversations List */}
          <View style={styles.listSection}>
            {chats.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-outline" size={60} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySub}>Your conversations will appear here.</Text>
              </View>
            ) : (
              chats.map((item, index) => (
                <ConversationRow 
                  key={item.conversationId || `c${index}`} 
                  item={item} 
                  navigation={navigation}
                  isTyping={typingUsers[item.conversationId]}
                  isLast={index === chats.length - 1}
                />
              ))
            )}
          </View>

        </ScrollView>
      )}

      {/* Quick Unlock Modal */}
      <QuickUnlockModal
        visible={!!unlockUser}
        user={unlockUser}
        onClose={() => setUnlockUser(null)}
        onUnlockComplete={handleUnlockComplete}
      />
    </View>
  );
}

// ========================================================================
// QUICK UNLOCK MODAL STYLES
// ========================================================================
const qStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: W * 0.85,
    backgroundColor: 'rgba(20,12,18,0.97)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(139,92,246,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 22,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    marginBottom: 10,
  },
  btnSub: {
    backgroundColor: 'rgba(255,77,103,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.2)',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
});

// ========================================================================
// STYLES
// ========================================================================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  
  // Header
  headerWrap: {
    paddingTop: STATUS_BAR,
    paddingHorizontal: W * 0.05,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
  },

  // Content
  scrollContent: {
    paddingBottom: 100,
  },
  
  // IG-Style Stories
  storiesSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: W * 0.05,
    marginBottom: 12,
  },
  storiesScroll: {
    paddingHorizontal: W * 0.05,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: STORY_SIZE,
  },
  storyAvatarWrap: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    marginBottom: 8,
    position: 'relative',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: STORY_SIZE / 2,
  },
  storyLockOverlay: {
    position: 'absolute',
    bottom: -2,
    left: -2,
  },
  storyLockBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(30,15,25,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  storyOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CCC93',
    borderWidth: 2,
    borderColor: '#0d0507',
  },
  storyName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '400',
  },

  // Conversations List
  listSection: {
    paddingTop: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: W * 0.05,
    backgroundColor: 'transparent',
  },
  rowContent: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  
  // Avatar
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
    paddingVertical: 12, // Ensure row height even if avatar is small
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 12,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CCC93',
    borderWidth: 2,
    borderColor: '#0d0507',
  },

  // Row Text Info
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: -0.2,
  },
  rowNameUnread: {
    fontWeight: '700',
    color: '#fff',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '400',
  },
  rowTimeUnread: {
    color: '#FF4D67',
    fontWeight: '600',
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginRight: 16,
    lineHeight: 18,
  },
  lastMessageUnread: {
    color: '#fff',
    fontWeight: '600',
  },
  typingText: {
    flex: 1,
    fontSize: 14,
    color: '#FF4D67',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D67',
    marginLeft: 8,
  },

  // Empty State
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
});
