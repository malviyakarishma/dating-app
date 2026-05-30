import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity, Image, ActivityIndicator, RefreshControl
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
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [matchesRes, requestsRes] = await Promise.all([
        swipeService.getMatches(),
        swipeService.getRequests()
      ]);
      setMatches(matchesRes.data.matches || []);
      setRequests(requestsRes.data.requests || []);
    } catch (err) {
      console.error('Failed to load matches and requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRespond = async (swipeId, action) => {
    try {
      // Optimistic state update for requests
      setRequests(prev => prev.filter(r => r.swipeId !== swipeId));
      await swipeService.respondToRequest(swipeId, action);
      
      // Re-fetch all data to ensure match states and lists are fully in sync
      fetchData(false);
    } catch (err) {
      console.error('Failed to respond to request:', err);
      // Re-fetch in case of error to restore state
      fetchData(false);
    }
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
          <Text style={styles.headerText}>Matches</Text>
          <Text style={styles.headerSub}>
            {loading ? 'Loading...' : `${matches.length} matches • ${requests.length} requests`}
          </Text>
        </BlurView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#FF4D67" style={{ marginTop: 100 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4D67" />
          }
        >
          {/* Incoming Requests Section */}
          {requests.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={16} color="#FFD700" />
                <Text style={styles.sectionTitle}>Like Requests ({requests.length})</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {requests.map((item) => {
                  const user = item.user || {};
                  return (
                    <BlurView key={item.swipeId} intensity={30} tint="dark" style={styles.requestCard}>
                      <View style={styles.requestAvatarWrap}>
                        {user.photos && user.photos.length > 0 ? (
                          <Image source={resolveImageSource(user.photos[0])} style={styles.requestAvatar} />
                        ) : (
                          <View style={styles.placeholderAvatar}>
                            <Ionicons name="person" size={28} color="rgba(255,255,255,0.3)" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.requestName} numberOfLines={1}>
                        {user.name || 'Someone'}, {user.age || '20'}
                      </Text>
                      {user.bio ? (
                        <Text style={styles.requestBio} numberOfLines={1}>
                          {user.bio}
                        </Text>
                      ) : null}
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.declineBtn]}
                          onPress={() => handleRespond(item.swipeId, 'decline')}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRespond(item.swipeId, 'accept')}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={['#FF4D67', '#C2185B']}
                            style={[styles.actionBtn, styles.acceptBtn]}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </BlurView>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Matches Grid Section */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={16} color="#FF4D67" />
              <Text style={styles.sectionTitle}>Your Matches</Text>
            </View>

            {matches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={50} color={COLORS.taupe} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>No matches yet</Text>
                <Text style={styles.emptySub}>Keep swiping in discover to find your match!</Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {matches.map((item) => (
                  <TouchableOpacity 
                    key={item.id || item._id}
                    activeOpacity={0.8} 
                    style={styles.cardWrap}
                    onPress={() => navigation.navigate('ChatDM', {
                      userName: item.name,
                      otherUserId: item.id || item._id
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
                        <Text style={styles.matchName} numberOfLines={1}>{item.name}, {item.age || '20'}</Text>
                        <Ionicons name="chatbubbles-outline" size={W * 0.04} color="#FF4D67" />
                      </BlurView>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollContent: { paddingVertical: W * 0.04, flexGrow: 1 },
  sectionWrap: { marginBottom: W * 0.06 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: W * 0.04, marginBottom: W * 0.03, gap: 6 },
  sectionTitle: { fontSize: W * 0.04, fontWeight: '700', color: COLORS.cream, letterSpacing: 0.5 },
  
  // Requests Carousel
  horizontalList: { paddingHorizontal: W * 0.04, gap: W * 0.03, paddingBottom: 4 },
  requestCard: {
    width: W * 0.4,
    borderRadius: W * 0.04,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: W * 0.03,
    alignItems: 'center',
    overflow: 'hidden',
  },
  requestAvatarWrap: {
    width: W * 0.16,
    height: W * 0.16,
    borderRadius: W * 0.08,
    borderWidth: 2,
    borderColor: '#FF4D67',
    overflow: 'hidden',
    marginBottom: W * 0.02,
  },
  requestAvatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderAvatar: { width: '100%', height: '100%', backgroundColor: COLORS.maroon, justifyContent: 'center', alignItems: 'center' },
  requestName: { fontSize: W * 0.035, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 2 },
  requestBio: { fontSize: W * 0.028, color: COLORS.taupe, textAlign: 'center', marginBottom: W * 0.025, paddingHorizontal: 4 },
  btnRow: { flexDirection: 'row', gap: W * 0.03, justifyContent: 'center', alignItems: 'center' },
  actionBtn: {
    width: W * 0.09,
    height: W * 0.09,
    borderRadius: W * 0.045,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  acceptBtn: {
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },

  // Grid Section
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: W * 0.04,
    gap: W * 0.03,
  },
  cardWrap: { width: CARD_W, marginBottom: W * 0.01 },
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
  matchName: { fontSize: W * 0.035, fontWeight: '700', color: '#fff', flex: 1, marginRight: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40, width: '100%' },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  emptySub: { color: COLORS.taupe, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
