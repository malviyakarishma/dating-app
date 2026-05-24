import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions, FlatList, Modal, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import * as chatService from '../services/chatService.js';

const { width: W } = Dimensions.get('window');

const THEMES = {
  Default: {
    bgColors: ['#1a0a0e', COLORS.burgundy, '#0d0507'],
    bubbleColor: COLORS.maroon,
    name: 'Default (Crimson)',
  },
  Ocean: {
    bgColors: ['#0a151a', '#0a4b59', '#051114'],
    bubbleColor: '#0a849c',
    name: 'Ocean (Blue)',
  },
  Forest: {
    bgColors: ['#0a1a0e', '#1a5929', '#051408'],
    bubbleColor: '#2E8B57',
    name: 'Forest (Green)',
  },
  Midnight: {
    bgColors: ['#090a0f', '#191b33', '#040508'],
    bubbleColor: '#483D8B',
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
  
  const flatListRef = useRef(null);
  const theme = THEMES[currentThemeKey];
  const { user: currentUser } = useAuth();

  const fetchMessages = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await chatService.getMessages(otherUserId);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);

    // Poll for new messages every 4 seconds to simulate real-time chat
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [otherUserId]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    
    const textToSend = inputText.trim();
    setInputText('');

    try {
      // Optimistically append the message to UI
      const tempMessage = {
        id: Date.now().toString(),
        text: textToSend,
        sender: currentUser._id,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Call API
      await chatService.sendMessage(otherUserId, textToSend);
      
      // Refresh messages logs
      fetchMessages(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === currentUser._id || item.sender === 'me';
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
        <View style={[
          styles.bubble, 
          isMe ? { backgroundColor: theme.bubbleColor } : styles.bubbleThem
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
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
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 }} edges={['top', 'bottom']}>
        {/* Header */}
        <BlurView intensity={40} tint="dark" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={W * 0.07} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{userName}</Text>
          </View>
          <TouchableOpacity onPress={() => setThemeModalVisible(true)} style={styles.headerIcon}>
            <Ionicons name="color-palette-outline" size={W * 0.06} color="#fff" />
          </TouchableOpacity>
        </BlurView>

        {/* Chat List */}
        {loading ? (
          <ActivityIndicator size="large" color="#FF4D67" style={{ flex: 1 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id || item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input Area */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <BlurView intensity={30} tint="dark" style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: theme.bubbleColor }]}>
              <Ionicons name="send" size={W * 0.045} color="#fff" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </BlurView>
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

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: W * 0.04, paddingVertical: W * 0.03,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: W * 0.05, fontWeight: 'bold', color: '#fff' },
  
  listContent: { padding: W * 0.04, paddingBottom: W * 0.08 },
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
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: W * 0.04, paddingVertical: W * 0.03,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    paddingBottom: Platform.OS === 'ios' ? W * 0.06 : W * 0.03,
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
