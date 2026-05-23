import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const AVATAR_SIZE = W * 0.14;

const dummyChats = [
  { id: '1', name: 'Ananya', lastMessage: 'Hey! How are you?', time: '2m ago', unread: 2 },
  { id: '2', name: 'Arjun', lastMessage: 'Want to grab coffee?', time: '15m ago', unread: 0 },
  { id: '3', name: 'Priya', lastMessage: 'That sounds great! 😊', time: '1h ago', unread: 1 },
  { id: '4', name: 'Vikram', lastMessage: 'See you tomorrow!', time: '3h ago', unread: 0 },
  { id: '5', name: 'Neha', lastMessage: 'Love that place ✨', time: '5h ago', unread: 0 },
];

export default function ChatScreen() {
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
          <Text style={styles.headerSub}>{dummyChats.length} conversations</Text>
        </BlurView>
      </View>

      <FlatList
        data={dummyChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.7}>
            <BlurView intensity={30} tint="dark" style={[styles.chatRow, { overflow: 'hidden' }]}>
              <LinearGradient
                colors={[COLORS.maroon, COLORS.burgundy]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{item.name[0]}</Text>
              </LinearGradient>
              <View style={styles.chatInfo}>
                <View style={styles.chatTop}>
                  <Text style={styles.chatName}>{item.name}</Text>
                  <Text style={styles.chatTime}>{item.time}</Text>
                </View>
                <View style={styles.chatBottom}>
                  <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                  {item.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>
        )}
      />
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
  listContent: { padding: W * 0.04, gap: W * 0.025 },
  chatRow: {
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
  badge: {
    backgroundColor: COLORS.maroon, width: W * 0.055, height: W * 0.055,
    borderRadius: W * 0.028, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: W * 0.028, fontWeight: 'bold' },
});
