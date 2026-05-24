import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, Platform, TouchableOpacity, Image, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import * as swipeService from '../services/swipeService.js';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - W * 0.12) / 2;

const resolveImageSource = (photo) => {
  if (typeof photo === 'string') {
    return { uri: photo };
  }
  return photo;
};

export default function MatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await swipeService.getMatches();
      setMatches(res.data.matches);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

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
          <Text style={styles.headerText}>Matches</Text>
          <Text style={styles.headerSub}>
            {loading ? 'Loading...' : `${matches.length} people matched with you`}
          </Text>
        </BlurView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF4D67" style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={matches}
          numColumns={2}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={50} color={COLORS.taupe} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No matches yet</Text>
              <Text style={styles.emptySub}>Keep swiping in discover to find your match!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.cardWrap}
              onPress={() => navigation.navigate('Messages', {
                screen: 'ChatDM',
                params: { userName: item.name, otherUserId: item.id || item._id }
              })}
            >
              <View style={styles.card}>
                {item.photos && item.photos.length > 0 ? (
                  <Image source={resolveImageSource(item.photos[0])} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: COLORS.maroon, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={50} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.cardGradient}
                />
                
                <BlurView intensity={50} tint="dark" style={[styles.cardInfo, { overflow: 'hidden' }]}>
                  <Text style={styles.matchName}>{item.name}, {item.age || '20'}</Text>
                  <Ionicons name="heart" size={W * 0.04} color={COLORS.maroon} />
                </BlurView>
              </View>
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
    borderRadius: W * 0.04, padding: W * 0.04,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  headerText: { fontSize: W * 0.065, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: W * 0.032, color: COLORS.taupe, marginTop: 2 },
  listContent: { padding: W * 0.04, gap: W * 0.03, flexGrow: 1 },
  row: { gap: W * 0.03 },
  cardWrap: { width: CARD_W },
  card: {
    borderRadius: W * 0.045, overflow: 'hidden', aspectRatio: 0.7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  cardInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: W * 0.03, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  matchName: { fontSize: W * 0.035, fontWeight: '700', color: '#fff' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  emptySub: { color: COLORS.taupe, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
