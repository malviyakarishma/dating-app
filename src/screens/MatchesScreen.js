import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { COLORS } from '../theme/colors';

const dummyMatches = [
  { id: '1', name: 'Alex' },
  { id: '2', name: 'Sam' },
  { id: '3', name: 'Jordan' },
  { id: '4', name: 'Taylor' },
];

export default function MatchesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>New Matches</Text>
      </View>
      <FlatList
        data={dummyMatches}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <View style={styles.avatarPlaceholder} />
            <Text style={styles.matchName}>{item.name}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    paddingHorizontal: 10,
  },
  matchCard: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    marginBottom: 10,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
