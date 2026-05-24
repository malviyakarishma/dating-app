import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, Platform, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import * as chatService from '../services/chatService.js';

const { width: W } = Dimensions.get('window');
const AVATAR_SIZE = W * 0.14;

export default function ChatScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await chatService.getConversations();
      setChats(res.data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Poll or fetch conversations list on focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchChats();
    });
    return unsubscribe;
  }, [navigation]);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    // Check if same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Default: date string
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
          keyExtractor={(item) => item.user.id || item.user._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={50} color={COLORS.taupe} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySub}>Go to Matches and tap on a match profile to start chatting!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ChatDM', { 
                userName: item.user.name, 
                otherUserId: item.user.id || item.user._id 
              })}
            >
              <BlurView intensity={30} tint="dark" style={[styles.chatRow, { overflow: 'hidden' }]}>
                <LinearGradient
                  colors={[COLORS.maroon, COLORS.burgundy]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{item.user.name[0]}</Text>
                </LinearGradient>
                <View style={styles.chatInfo}>
                  <View style={styles.chatTop}>
                    <Text style={styles.chatName}>{item.user.name}</Text>
                    <Text style={styles.chatTime}>
                      {item.latestMessage ? formatMessageTime(item.latestMessage.createdAt) : ''}
                    </Text>
                  </View>
                  <View style={styles.chatBottom}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.latestMessage ? item.latestMessage.text : 'Start a conversation...'}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  headerWrap: { paddingTop: Platform.OS === 'ios' ? 54 : 40, paddingHorizontal: W * 0.04 },
  header: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: W * 0.04, padding: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  headerText: { fontSize: W * 0.065, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: W * 0.032, color: COLORS.taupe, marginTop: 2 },
  listContent: { padding: W * 0.04, gap: W * 0.025, flexGrow: 1 },
  chatRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row', alignItems: 'center',
    padding: W * 0.035, borderRadius: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: AVATAR_SIZE * 0.42, fontWeight: 'bold', color: '#fff' },
  chatInfo: { flex: 1, marginLeft: W * 0.035 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: W * 0.042, fontWeight: '700', color: '#fff' },
  chatTime: { fontSize: W * 0.03, color: COLORS.taupe },
  chatBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  lastMessage: { fontSize: W * 0.035, color: 'rgba(255,255,255,0.6)', flex: 1, marginRight: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  emptySub: { color: COLORS.taupe, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
