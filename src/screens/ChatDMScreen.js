import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Platform, Dimensions, FlatList, Modal, ActivityIndicator, Keyboard, Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import * as chatService from '../services/chatService.js';
import * as paymentService from '../services/paymentService.js';
import * as socket from '../services/socket.js';

const { width: W } = Dimensions.get('window');

const THEMES = {
  Default: {
    bgColors: ['#1a0a0e', COLORS.burgundy, '#0d0507'],
    bubbleColor: COLORS.maroon,
    inputBg: '#180a0d',
    name: 'Default (Crimson)',
  },
  Ocean: {
    bgColors: ['#0a151a', '#0a4b59', '#051114'],
    bubbleColor: '#0a849c',
    inputBg: '#081317',
    name: 'Ocean (Blue)',
  },
  Forest: {
    bgColors: ['#0a1a0e', '#1a5929', '#051408'],
    bubbleColor: '#2E8B57',
    inputBg: '#08150c',
    name: 'Forest (Green)',
  },
  Midnight: {
    bgColors: ['#090a0f', '#191b33', '#040508'],
    bubbleColor: '#483D8B',
    inputBg: '#080911',
    name: 'Midnight (Dark)',
  }
};

/**
 * Format remaining time for display.
 */
const formatCountdown = (ms) => {
  if (!ms || ms <= 0) return 'Expired';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// ========================================================================
// ACCESS EXPIRED OVERLAY
// ========================================================================
const AccessExpiredOverlay = ({ userName, onRenew, loading }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[expiredStyles.container, {
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim,
    }]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={expiredStyles.content}>
        <View style={expiredStyles.lockCircle}>
          <LinearGradient
            colors={['#8B5CF6', '#FF4D67']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={expiredStyles.lockGradient}
          >
            <Ionicons name="lock-closed" size={32} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={expiredStyles.title}>Chat Access Expired</Text>
        <Text style={expiredStyles.subtitle}>
          Renew access to continue chatting with {userName}
        </Text>

        <TouchableOpacity
          style={expiredStyles.renewBtn}
          onPress={() => onRenew('ONE_TIME')}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={expiredStyles.renewBtnText}>Renew · ₹20 for 24 hours</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={expiredStyles.subBtn}
          onPress={() => onRenew('SUBSCRIPTION')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons name="repeat" size={16} color="#FF4D67" />
          <Text style={expiredStyles.subBtnText}>Auto-Renew · ₹20/day</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ========================================================================
// MAIN SCREEN
// ========================================================================
export default function ChatDMScreen({ route, navigation }) {
  const { userName = 'User', otherUserId } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [currentThemeKey, setCurrentThemeKey] = useState('Default');
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);

  // Real-time Chat States
  const [conversationId, setConversationId] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // Chat Access States
  const [hasAccess, setHasAccess] = useState(null); // null = loading, true/false = resolved
  const [accessInfo, setAccessInfo] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [renewLoading, setRenewLoading] = useState(false);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const theme = THEMES[currentThemeKey];
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  // ─── Chat Access Verification ──────────────────────────────────────────
  const checkAccess = async () => {
    try {
      const res = await paymentService.getChatAccess(otherUserId);
      const data = res.data;
      setAccessInfo(data);
      setHasAccess(data?.hasAccess || false);
      setRemainingTime(data?.remainingTime || null);
      return data?.hasAccess || false;
    } catch (err) {
      console.error('Access check failed:', err);
      setHasAccess(false);
      return false;
    }
  };

  // Countdown timer for remaining access
  useEffect(() => {
    if (hasAccess && remainingTime && remainingTime > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 60000) {
            // Less than 1 minute — re-check access
            clearInterval(countdownIntervalRef.current);
            checkAccess();
            return 0;
          }
          return prev - 60000; // Decrement by 1 minute
        });
      }, 60000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [hasAccess, remainingTime]);

  // ─── Handle Renewal ────────────────────────────────────────────────────
  const handleRenew = async (paymentType) => {
    try {
      setRenewLoading(true);
      const res = await paymentService.unlockChat(otherUserId, paymentType);
      const url = res.data?.checkoutUrl;
      if (url) {
        await WebBrowser.openBrowserAsync(url);
        // Wait for webhook
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Re-check access
        const granted = await checkAccess();
        if (granted) {
          loadChatHistory();
        }
      }
    } catch (err) {
      console.error('Renewal failed:', err.message);
    } finally {
      setRenewLoading(false);
    }
  };

  // ─── Load Chat History ─────────────────────────────────────────────────
  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const res = await chatService.getMessages(otherUserId);
      const convId = res.data.conversationId;

      setConversationId(convId);
      setMessages(res.data.messages || []);

      // Verify user's online state from current conversation participant metadata
      const convs = await chatService.getConversations();
      const activeConv = convs.data.conversations?.find(c => c.conversationId === convId);
      if (activeConv) {
        setIsOnline(activeConv.user.isOnline);
        setLastSeen(activeConv.user.lastSeen);
      }

      // Initialize Socket connection and join room
      const activeSocket = await socket.initSocket();
      if (activeSocket) {
        activeSocket.emit('joinConversation', { conversationId: convId });
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // First check access, then load chat if access is granted
    const init = async () => {
      const granted = await checkAccess();
      if (granted) {
        await loadChatHistory();
      } else {
        setLoading(false);
      }
    };
    init();

    return () => {
      if (conversationId) {
        socket.emit('leaveConversation', { conversationId });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [otherUserId]);

  useEffect(() => {
    // 1) Real-time message receive
    const handleReceiveMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          // Avoid duplicate local optimistic appends
          const exists = prev.some(m => m._id === msg._id || m.id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });

        // If we are viewing this screen, mark incoming message as seen instantly
        if (msg.senderId !== currentUser._id) {
          socket.emit('markSeen', { conversationId, senderId: otherUserId });
        }

        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 150);
      }
    };

    // 2) Real-time read receipt updates
    const handleMessageDelivered = ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        (m._id === messageId || m.id === messageId)
          ? { ...m, status: 'delivered' }
          : m
      ));
    };

    const handleMessageSeen = ({ readerId }) => {
      if (readerId === otherUserId) {
        setMessages(prev => prev.map(m =>
          m.senderId === currentUser._id || m.sender === 'me'
            ? { ...m, status: 'seen' }
            : m
        ));
      }
    };

    // 3) Online status listeners
    const handleUserOnline = ({ userId, lastSeen: time }) => {
      if (userId === otherUserId) {
        setIsOnline(true);
        setLastSeen(time);
      }
    };

    const handleUserOffline = ({ userId, lastSeen: time }) => {
      if (userId === otherUserId) {
        setIsOnline(false);
        setLastSeen(time);
      }
    };

    // 4) Typing indicator listeners
    const handleTypingStart = ({ senderId }) => {
      if (senderId === otherUserId) {
        setIsOnline(true); // Implicitly online if typing
        setIsTyping(true);

        // Auto stop after 3 seconds of inactivity
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    const handleTypingStop = ({ senderId }) => {
      if (senderId === otherUserId) {
        setIsTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    // 5) Chat access expired socket error
    const handleError = (err) => {
      if (err?.code === 'CHAT_ACCESS_EXPIRED') {
        checkAccess(); // Re-verify and show overlay
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageSeen', handleMessageSeen);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('typingStart', handleTypingStart);
    socket.on('typingStop', handleTypingStop);
    socket.on('error', handleError);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageSeen', handleMessageSeen);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('typingStart', handleTypingStart);
      socket.off('typingStop', handleTypingStop);
      socket.off('error', handleError);
    };
  }, [conversationId, otherUserId]);

  // Handle typing input changes and emit events
  const handleTextChange = (text) => {
    setInputText(text);

    if (conversationId && otherUserId) {
      if (text.length > 0) {
        socket.emit('typingStart', { conversationId, receiverId: otherUserId });
      } else {
        socket.emit('typingStop', { conversationId, receiverId: otherUserId });
      }
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === '' || !hasAccess) return;

    const textToSend = inputText.trim();
    setInputText('');

    // Emit stop typing event on send
    if (conversationId && otherUserId) {
      socket.emit('typingStop', { conversationId, receiverId: otherUserId });
    }

    // Optimistic UI Append
    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      id: tempId,
      text: textToSend,
      senderId: currentUser._id,
      sender: 'me',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 150);

    try {
      if (conversationId) {
        // Emit via socket to ensure immediate delivery
        socket.emit('sendMessage', {
          conversationId,
          text: textToSend,
          receiverId: otherUserId,
        });
      } else {
        // Fallback REST endpoint
        await chatService.sendMessage(otherUserId, textToSend);
        loadChatHistory();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Humanize online last seen tags
  const getOnlineStatusText = () => {
    if (isOnline) return 'Active now';
    if (!lastSeen) return '';

    const date = new Date(lastSeen);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Active just now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;

    return `Active yesterday`;
  };

  const renderMessage = ({ item }) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const senderIdStr = item.senderId?._id || item.senderId?.id || item.senderId;
    const isMe = (currentUserId && senderIdStr === currentUserId) || item.sender === 'me';

    // Status indicators: ✓ (sent), ✓✓ (delivered), Seen
    let statusText = '';
    if (isMe) {
      if (item.status === 'seen') statusText = 'Seen';
      else if (item.status === 'delivered') statusText = '✓ Delivered';
      else statusText = '✓ Sent';
    }

    return (
      <View style={[dmStyles.messageRow, isMe ? dmStyles.messageRowMe : dmStyles.messageRowThem]}>
        <View style={[
          dmStyles.bubble,
          isMe ? { backgroundColor: theme.bubbleColor } : dmStyles.bubbleThem
        ]}>
          <Text style={dmStyles.messageText}>{item.text}</Text>
          <View style={dmStyles.messageFooter}>
            <Text style={dmStyles.timeText}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <Text style={[dmStyles.statusText, item.status === 'seen' && { color: '#4CCC93' }]}>
                {statusText}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={dmStyles.screen}>
      <LinearGradient
        colors={theme.bgColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1 }}>
        {/* Header */}
        <BlurView
          intensity={40}
          tint="dark"
          style={[
            dmStyles.header,
            {
              height: 64 + insets.top,
              paddingTop: insets.top
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              navigation.goBack();
            }}
            style={dmStyles.headerIcon}
          >
            <Ionicons name="chevron-back" size={W * 0.07} color="#fff" />
          </TouchableOpacity>
          <View style={dmStyles.headerTitleWrap}>
            <Text style={dmStyles.headerTitle}>{userName}</Text>
            <View style={dmStyles.statusRow}>
              {isOnline && <View style={dmStyles.onlineDot} />}
              <Text style={dmStyles.statusSub}>{getOnlineStatusText()}</Text>
              {/* Remaining time badge */}
              {hasAccess && remainingTime && remainingTime > 0 && (
                <View style={dmStyles.timeBadge}>
                  <Ionicons name="time-outline" size={10} color="#8B5CF6" />
                  <Text style={dmStyles.timeBadgeText}>{formatCountdown(remainingTime)}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => setThemeModalVisible(true)} style={dmStyles.headerIcon}>
            <Ionicons name="color-palette-outline" size={W * 0.06} color="#fff" />
          </TouchableOpacity>
        </BlurView>

        {/* Access check loading state */}
        {hasAccess === null ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 14 }}>
              Verifying chat access...
            </Text>
          </View>
        ) : hasAccess === false ? (
          // Access expired overlay
          <AccessExpiredOverlay
            userName={userName}
            onRenew={handleRenew}
            loading={renewLoading}
          />
        ) : (
          // Full chat interface
          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1 }}
            keyboardVerticalOffset={0}
          >
            {/* Chat List - takes remaining space */}
            <View style={{ flex: 1 }}>
              {loading ? (
                <ActivityIndicator size="large" color="#FF4D67" style={{ flex: 1 }} />
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={[...messages].reverse()}
                  keyExtractor={(item) => item.id || item._id}
                  renderItem={renderMessage}
                  style={{ flex: 1 }}
                  contentContainerStyle={dmStyles.listContent}
                  showsVerticalScrollIndicator={false}
                  inverted={true}
                  keyboardDismissMode="interactive"
                  keyboardShouldPersistTaps="handled"
                />
              )}

              {/* Typing indicator bubble */}
              {isTyping && (
                <View style={dmStyles.typingContainer}>
                  <BlurView intensity={30} tint="dark" style={dmStyles.typingBlur}>
                    <Text style={dmStyles.typingBubbleText}>{userName} is typing...</Text>
                  </BlurView>
                </View>
              )}
            </View>

            {/* Input Area */}
            <View
              style={[
                dmStyles.inputContainer,
                {
                  backgroundColor: theme.inputBg || '#180a0d',
                  paddingBottom: insets.bottom || W * 0.03
                }
              ]}
            >
              {accessInfo?.canSend ? (
                <>
                  <TextInput
                    style={dmStyles.textInput}
                    placeholder="Type a message..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={inputText}
                    onChangeText={handleTextChange}
                    multiline
                  />
                  <TouchableOpacity onPress={handleSend} style={[dmStyles.sendBtn, { backgroundColor: theme.bubbleColor }]}>
                    <Ionicons name="send" size={W * 0.045} color="#fff" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  onPress={() => handleRenew('ONE_TIME')} 
                  style={{ backgroundColor: '#8B5CF6', flex: 1, paddingVertical: 14, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}
                  disabled={renewLoading}
                >
                  {renewLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Unlock to Reply (₹50)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        )}

        {/* Theme Picker Modal */}
        <Modal
          visible={isThemeModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setThemeModalVisible(false)}
        >
          <View style={dmStyles.modalOverlay}>
            <View style={dmStyles.modalContent}>
              <Text style={dmStyles.modalTitle}>Choose Chat Theme</Text>
              {Object.keys(THEMES).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    dmStyles.themeOption,
                    currentThemeKey === key && { borderColor: THEMES[key].bubbleColor, backgroundColor: 'rgba(255,255,255,0.1)' }
                  ]}
                  onPress={() => {
                    setCurrentThemeKey(key);
                    setThemeModalVisible(false);
                  }}
                >
                  <View style={[dmStyles.themeColorDot, { backgroundColor: THEMES[key].bubbleColor }]} />
                  <Text style={dmStyles.themeOptionText}>{THEMES[key].name}</Text>
                  {currentThemeKey === key && <Ionicons name="checkmark" size={20} color={THEMES[key].bubbleColor} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setThemeModalVisible(false)} style={dmStyles.closeModalBtn}>
                <Text style={dmStyles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
}

// ========================================================================
// ACCESS EXPIRED OVERLAY STYLES
// ========================================================================
const expiredStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockCircle: {
    marginBottom: 24,
  },
  lockGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    marginBottom: 12,
  },
  renewBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  subBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,77,103,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.2)',
  },
  subBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF4D67',
  },
});

// ========================================================================
// CHAT DM STYLES
// ========================================================================
const dmStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: W * 0.04,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: W * 0.048, fontWeight: 'bold', color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CCC93' },
  statusSub: { fontSize: W * 0.03, color: COLORS.taupe, fontWeight: '500' },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(139,92,246,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
  },

  listContent: { padding: W * 0.03, paddingTop: W * 0.02 },
  messageRow: { marginBottom: W * 0.04, flexDirection: 'row' },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%', padding: W * 0.035, borderRadius: W * 0.04,
  },
  bubbleThem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: { color: '#fff', fontSize: W * 0.04, lineHeight: 22 },
  messageFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    gap: 8, marginTop: 4,
  },
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
  statusText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '600' },

  typingContainer: {
    paddingHorizontal: W * 0.06,
    paddingVertical: W * 0.02,
    alignSelf: 'flex-start',
  },
  typingBlur: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  typingBubbleText: { color: '#4CCC93', fontSize: 12, fontStyle: 'italic', fontWeight: '500' },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: W * 0.04, paddingTop: W * 0.03,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  textInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: W * 0.05, paddingHorizontal: W * 0.04, paddingTop: W * 0.03, paddingBottom: W * 0.03,
    color: '#fff', fontSize: W * 0.04, maxHeight: 100,
  },
  sendBtn: {
    width: W * 0.12, height: W * 0.12, borderRadius: W * 0.06,
    justifyContent: 'center', alignItems: 'center', marginLeft: W * 0.03,
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: W * 0.85, backgroundColor: '#1a1a24', borderRadius: W * 0.05, padding: W * 0.05,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  modalTitle: { fontSize: W * 0.05, fontWeight: 'bold', color: '#fff', marginBottom: W * 0.04, textAlign: 'center' },
  themeOption: {
    flexDirection: 'row', alignItems: 'center',
    padding: W * 0.04, borderRadius: W * 0.03, marginBottom: W * 0.02,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)'
  },
  themeColorDot: { width: 20, height: 20, borderRadius: 10, marginRight: 12 },
  themeOptionText: { flex: 1, color: '#fff', fontSize: W * 0.04 },
  closeModalBtn: { marginTop: W * 0.02, paddingVertical: W * 0.03, alignItems: 'center' },
  closeModalText: { color: COLORS.taupe, fontSize: W * 0.04, fontWeight: '600' }
});
