import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, Platform, TouchableOpacity, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = (W - W * 0.12) / 2;

const dummyMatches = [
  { id: '1', name: 'Ananya', age: 24, photo: require('../../assets/profile1.png'), new: true },
  { id: '2', name: 'Arjun', age: 27, photo: require('../../assets/profile2.png'), new: true },
  { id: '3', name: 'Priya', age: 23, photo: require('../../assets/profile3.png'), new: false },
  { id: '4', name: 'Vikram', age: 26, photo: require('../../assets/profile4.png'), new: false },
  { id: '5', name: 'Yogesh', age: 22, photo: require('../../assets/profile5.jpeg'), new: false },
];

export default function MatchesScreen() {
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
          <Text style={styles.headerSub}>{dummyMatches.length} people liked you</Text>
        </BlurView>
      </View>

      <FlatList
        data={dummyMatches}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} style={styles.cardWrap}>
            <View style={styles.card}>
              <Image source={item.photo} style={styles.cardImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.cardGradient}
              />
              {item.new && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              <BlurView intensity={50} tint="dark" style={[styles.cardInfo, { overflow: 'hidden' }]}>
                <Text style={styles.matchName}>{item.name}, {item.age}</Text>
                <Ionicons name="heart" size={W * 0.04} color={COLORS.maroon} />
              </BlurView>
            </View>
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
  listContent: { padding: W * 0.04, gap: W * 0.03 },
  row: { gap: W * 0.03 },
  cardWrap: { width: CARD_W },
  card: {
    borderRadius: W * 0.045, overflow: 'hidden', aspectRatio: 0.7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  newBadge: {
    position: 'absolute', top: W * 0.025, left: W * 0.025,
    backgroundColor: COLORS.maroon, paddingHorizontal: W * 0.025, paddingVertical: W * 0.012,
    borderRadius: W * 0.015,
  },
  newBadgeText: { color: '#fff', fontSize: W * 0.025, fontWeight: '800', letterSpacing: 1 },
  cardInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: W * 0.03, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  matchName: { fontSize: W * 0.035, fontWeight: '700', color: '#fff' },
});
