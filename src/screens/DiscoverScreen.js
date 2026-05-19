import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../theme/colors';

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Discover</Text>
      </View>
      <View style={styles.cardContainer}>
        {/* Placeholder for the Swipe Card */}
        <View style={styles.card}>
          <View style={styles.imagePlaceholder} />
          <View style={styles.cardInfo}>
            <Text style={styles.name}>Jessica, 24</Text>
            <Text style={styles.bio}>Love hiking and coffee.</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <View style={[styles.button, styles.nopeButton]}>
          <Text style={styles.nopeText}>X</Text>
        </View>
        <View style={[styles.button, styles.superLikeButton]}>
          <Text style={styles.superLikeText}>★</Text>
        </View>
        <View style={[styles.button, styles.likeButton]}>
          <Text style={styles.likeText}>♥</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  cardInfo: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bio: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
    gap: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  nopeButton: {
    borderColor: '#F06966',
    borderWidth: 1,
  },
  nopeText: {
    color: '#F06966',
    fontSize: 24,
    fontWeight: 'bold',
  },
  likeButton: {
    borderColor: '#4CCC93',
    borderWidth: 1,
  },
  likeText: {
    color: '#4CCC93',
    fontSize: 24,
    fontWeight: 'bold',
  },
  superLikeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: '#3AB4CC',
    borderWidth: 1,
  },
  superLikeText: {
    color: '#3AB4CC',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
