import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, Platform, TouchableOpacity, ActivityIndicator, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import * as chatService from '../services/chatService.js';
import * as socket from '../services/socket.js';

const { width: W } = Dimensions.get('window');
const AVATAR_SIZE = W * 0.14;

export default function ChatScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> boolean

  const fetchChats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await chatService.getConversations();
      setChats(res.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats(true);

    const unsubscribe = navigation.addListener('focus', () => {
      fetchChats(false);
      socket.initSocket();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // 1) Handle real-time incoming messages & preview updates
    const handleReceiveMessage = (msg) => {
      setChats((prevChats) => {
        const updated = [...prevChats];
        const index = updated.findIndex(c => c.conversationId === msg.conversationId);
        
        if (index !== -1) {
          const target = { ...updated[index] };
          target.latestMessage = msg;
          
          // Increment unread count if we aren't the sender
          if (msg.senderId !== socket.getSocket()?.user?._id) {
            target.unreadCount = (target.unreadCount || 0) + 1;
          }

          // Remove and shift to top
          updated.splice(index, 1);
          updated.unshift(target);
        } else {
          // Re-fetch conversation list to grab the new user profile
          fetchChats(false);
        }
        return updated;
      });
    };

    // 2) Handle online/offline updates
    const handleUserOnline = ({ userId }) => {
      setChats(prev => prev.map(c => 
        (c.user.id === userId || c.user._id === userId) 
          ? { ...c, user: { ...c.user, isOnline: true } }
          : c
      ));
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setChats(prev => prev.map(c => 
        (c.user.id === userId || c.user._id === userId) 
          ? { ...c, user: { ...c.user, isOnline: false, lastSeen } }
          : c
      ));
    };

    // 3) Handle typing previews
    const handleTypingStart = ({ conversationId }) => {
      setTypingUsers(prev => ({ ...prev, [conversationId]: true }));
    };

    const handleTypingStop = ({ conversationId }) => {
      setTypingUsers(prev => ({ ...prev, [conversationId]: false }));
    };

    // Bind real-time socket events
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
  }, []);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.headerWrap}>
        <BlurView intensity={40} tint="dark" style={[styles.header, { overflow: 'hidden' }]}>
          <Text style={styles.headerText}>Messages</Text>
          <Text style={styles.headerSub}>
            {loading ? 'Loading...' : `${chats.length} active conversations`}
          </Text>
        </BlurView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF4D67" style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.conversationId || item.user.id || item.user._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={50} color={COLORS.taupe} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySub}>Go to Matches and tap on a match profile to start chatting!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isTyping = typingUsers[item.conversationId];
            return (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ChatDM', { 
                  userName: item.user.name, 
                  otherUserId: item.user.id || item.user._id 
                })}
              >
                <BlurView intensity={30} tint="dark" style={[styles.chatRow, { overflow: 'hidden' }]}>
                  <View style={styles.avatarContainer}>
                    {item.user.photos && item.user.photos.length > 0 ? (
                      <Image source={{ uri: item.user.photos[0] }} style={styles.avatar} />
                    ) : (
                      <LinearGradient
                        colors={[COLORS.maroon, COLORS.burgundy]}
                        style={styles.avatar}
                      >
                        <Text style={styles.avatarText}>{item.user.name[0]}</Text>
                      </LinearGradient>
                    )}
                    {item.user.isOnline && <View style={styles.onlineBadge} />}
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTop}>
                      <Text style={styles.chatName}>{item.user.name}</Text>
                      <Text style={styles.chatTime}>
                        {item.latestMessage ? formatMessageTime(item.latestMessage.createdAt) : ''}
                      </Text>
                    </View>
                    <View style={styles.chatBottom}>
                      {isTyping ? (
                        <Text style={styles.typingText}>Typing...</Text>
                      ) : (
                        <Text 
                          style={[
                            styles.lastMessage, 
                            item.unreadCount > 0 && { color: '#fff', fontWeight: '700' }
                          ]} 
                          numberOfLines={1}
                        >
                          {item.latestMessage ? item.latestMessage.text : 'Start a conversation...'}
                        </Text>
                      )}
                      
                      {item.unreadCount > 0 && !isTyping && (
                        <LinearGradient colors={['#FF4D67', '#C2185B']} style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </LinearGradient>
                      )}
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  headerWrap: { paddingTop: Platform.OS === 'ios' ? 54 : 40, paddingHorizontal: W * 0.04 },
  header: {
    borderRadius: W * 0.04, padding: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  headerText: { fontSize: W * 0.065, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: W * 0.032, color: COLORS.taupe, marginTop: 2 },
  listContent: { padding: W * 0.04, gap: W * 0.025, flexGrow: 1 },
  chatRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row', alignItems: 'center',
    padding: W * 0.035, borderRadius: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center', alignItems: 'center', resizeMode: 'cover',
  },
  avatarText: { fontSize: AVATAR_SIZE * 0.42, fontWeight: 'bold', color: '#fff' },
  onlineBadge: {
    position: 'absolute', bottom: 1, right: 1,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4CCC93', borderWidth: 2.5, borderColor: '#12070a',
  },
  chatInfo: { flex: 1, marginLeft: W * 0.035 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: W * 0.042, fontWeight: '700', color: '#fff' },
  chatTime: { fontSize: W * 0.03, color: COLORS.taupe },
  chatBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  lastMessage: { fontSize: W * 0.035, color: 'rgba(255,255,255,0.6)', flex: 1, marginRight: 8 },
  typingText: { fontSize: W * 0.035, color: '#4CCC93', fontWeight: '600', fontStyle: 'italic', flex: 1 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  emptySub: { color: COLORS.taupe, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
