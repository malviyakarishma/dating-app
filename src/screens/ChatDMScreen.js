import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Platform, Dimensions, FlatList, Modal, ActivityIndicator, Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import * as chatService from '../services/chatService.js';
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

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const theme = THEMES[currentThemeKey];
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  // Load chat logs and initialize Socket bindings
  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const res = await chatService.getMessages(otherUserId);
      const convId = res.data.conversationId;

      setConversationId(convId);
      setMessages(res.data.messages || []);

      // Verify user's online state from current conversation participant metadata
      // (Optional: fetch active conversations list to grab initial status)
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
    loadChatHistory();

    return () => {
      if (conversationId) {
        socket.emit('leaveConversation', { conversationId });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [otherUserId, conversationId]);

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

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageSeen', handleMessageSeen);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('typingStart', handleTypingStart);
    socket.on('typingStop', handleTypingStop);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageSeen', handleMessageSeen);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('typingStart', handleTypingStart);
      socket.off('typingStop', handleTypingStop);
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
    if (inputText.trim() === '') return;

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
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
        <View style={[
          styles.bubble,
          isMe ? { backgroundColor: theme.bubbleColor } : styles.bubbleThem
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
          <View style={styles.messageFooter}>
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <Text style={[styles.statusText, item.status === 'seen' && { color: '#4CCC93' }]}>
                {statusText}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
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
            styles.header,
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
            style={styles.headerIcon}
          >
            <Ionicons name="chevron-back" size={W * 0.07} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{userName}</Text>
            <View style={styles.statusRow}>
              {isOnline && <View style={styles.onlineDot} />}
              <Text style={styles.statusSub}>{getOnlineStatusText()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setThemeModalVisible(true)} style={styles.headerIcon}>
            <Ionicons name="color-palette-outline" size={W * 0.06} color="#fff" />
          </TouchableOpacity>
        </BlurView>

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
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                inverted={true}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
              />
            )}

            {/* Typing indicator bubble */}
            {isTyping && (
              <View style={styles.typingContainer}>
                <BlurView intensity={30} tint="dark" style={styles.typingBlur}>
                  <Text style={styles.typingBubbleText}>{userName} is typing...</Text>
                </BlurView>
              </View>
            )}
          </View>

          {/* Input Area */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.inputBg || '#180a0d',
                paddingBottom: insets.bottom || W * 0.03
              }
            ]}
          >
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inputText}
              onChangeText={handleTextChange}
              multiline
            />
            <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: theme.bubbleColor }]}>
              <Ionicons name="send" size={W * 0.045} color="#fff" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Theme Picker Modal */}
        <Modal
          visible={isThemeModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setThemeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Chat Theme</Text>
              {Object.keys(THEMES).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themeOption,
                    currentThemeKey === key && { borderColor: THEMES[key].bubbleColor, backgroundColor: 'rgba(255,255,255,0.1)' }
                  ]}
                  onPress={() => {
                    setCurrentThemeKey(key);
                    setThemeModalVisible(false);
                  }}
                >
                  <View style={[styles.themeColorDot, { backgroundColor: THEMES[key].bubbleColor }]} />
                  <Text style={styles.themeOptionText}>{THEMES[key].name}</Text>
                  {currentThemeKey === key && <Ionicons name="checkmark" size={20} color={THEMES[key].bubbleColor} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setThemeModalVisible(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
