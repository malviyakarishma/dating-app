import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions, ScrollView, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { validateRequired } from '../utils/validators';

const { width: W } = Dimensions.get('window');

const musicGenres = ["Pop", "Rock", "Hip Hop", "Bollywood", "Punjabi", "EDM", "Jazz", "Classical", "Lo-fi", "Indie"];
const movieGenres = ["Action", "Comedy", "Romance", "Horror", "Thriller", "Sci-Fi", "Drama", "Adventure", "Animation", "Fantasy"];

const DropdownListItem = ({ icon, title, placeholder, value, onSelect, options, open, setOpen, error }) => {
  return (
    <View style={[{ zIndex: open ? 100 : 1 }]}>
      <TouchableOpacity 
        style={[styles.listItem, open && styles.listItemOpen, error && { borderColor: '#FF4D67', marginBottom: 0 }]} 
        activeOpacity={0.8}
        onPress={() => setOpen(!open)}
      >
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color="#FF4D67" />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={[styles.itemSubtitle, value && { color: '#fff' }]}>{value || placeholder}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownList}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
            {options.map((opt, index) => (
              <TouchableOpacity 
                key={opt}
                style={[
                  styles.dropdownOption, 
                  index === options.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[styles.dropdownOptionText, value === opt && styles.dropdownOptionTextActive]}>
                  {opt}
                </Text>
                {value === opt && <Ionicons name="checkmark" size={W * 0.04} color="#FF4D67" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {error && !open ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const TextInputListItem = ({ icon, title, placeholder, value, onChangeText, error, maxLength }) => (
  <View>
    <View style={[styles.listItem, error && { borderColor: '#FF4D67', marginBottom: 0 }]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color="#FF4D67" />
      </View>
      <View style={styles.itemTextWrap}>
        <Text style={styles.itemTitle}>{title}</Text>
        <TextInput 
          style={styles.itemInput}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
        />
      </View>
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const LookingForButton = ({ label, icon, active, onPress }) => (
  <TouchableOpacity style={[styles.lookingBtn, active && styles.lookingBtnActive]} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name={icon} size={24} color={active ? '#FF4D67' : 'rgba(255,255,255,0.5)'} style={{ marginBottom: 6 }} />
    <Text style={[styles.lookingBtnText, active && styles.lookingBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    {active && (
      <View style={styles.lookingCheck}>
        <Ionicons name="checkmark" size={10} color="#fff" />
      </View>
    )}
  </TouchableOpacity>
);

export default function ProfileSetupStep2Screen({ navigation }) {
  const { user, updateProfileStep } = useAuth();
  const [music, setMusic] = useState(user?.music || '');
  const [movies, setMovies] = useState(user?.movies || '');
  const [date, setDate] = useState(user?.date || '');
  const [food, setFood] = useState(user?.food || '');
  
  const [relationshipType, setRelationshipType] = useState(user?.relationshipType || 'Long-term');
  const [musicOpen, setMusicOpen] = useState(false);
  const [moviesOpen, setMoviesOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, []);

  const handleComplete = async () => {
    let valid = true;
    let newErrors = {};

    newErrors.music = validateRequired(music, "Please select your favorite music");
    newErrors.movies = validateRequired(movies, "Please select your favorite movie genre");
    newErrors.date = validateRequired(date, "Please describe your ideal date");
    newErrors.food = validateRequired(food, "Please enter your go-to food or place");

    if (newErrors.music || newErrors.movies || newErrors.date || newErrors.food) {
      valid = false;
    }

    setErrors(newErrors);
    if (valid) {
      try {
        setIsSubmitting(true);
        await updateProfileStep({
          music,
          movies,
          date,
          food,
          relationshipType,
        });
        navigation.navigate('ProfileSetupStep3');
      } catch (err) {
        setErrors({ ...newErrors, api: err.message || 'Failed to save. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={W * 0.05} color={COLORS.taupe} />
            </TouchableOpacity>

            {/* Progress Bar (3 dots, step 2 active) */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLine} />
              <Animated.View style={[styles.progressLine, { backgroundColor: '#FF4D67', zIndex: 2, width: progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] }) }]} />
              {[0, 1, 2].map((step, index) => {
                const isActive = index === 1; // Step 2 is active
                const isPast = index < 1;
                return (
                  <View key={step} style={[isActive ? styles.dotActiveWrap : styles.dotInactiveWrap, { zIndex: 3 }]}>
                    <View style={[styles.dotInactive, isActive && styles.dotActive, isPast && { backgroundColor: '#FF4D67' }]} />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Your Interests</Text>
            <Text style={styles.subtitle}>Share a few things you love so we can connect you better</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Section 1 Header */}
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={22} color="#FF4D67" style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.sectionTitle}>Tell us more about you</Text>
                <Text style={styles.sectionSubtitle}>Select all that apply</Text>
              </View>
            </View>

            {/* List Items */}
            <View style={{ marginBottom: W * 0.06 }}>
              <DropdownListItem 
                icon="musical-notes-outline"
                title="Favorite music genre/artist"
                placeholder="Choose your favorite"
                value={music} onSelect={(val) => { setMusic(val); setErrors({...errors, music: null}); }}
                options={musicGenres}
                open={musicOpen} setOpen={(val) => { setMusicOpen(val); setMoviesOpen(false); }}
                error={errors.music}
              />
              <DropdownListItem 
                icon="film-outline"
                title="Favorite movie genre"
                placeholder="Choose your favorite"
                value={movies} onSelect={(val) => { setMovies(val); setErrors({...errors, movies: null}); }}
                options={movieGenres}
                open={moviesOpen} setOpen={(val) => { setMoviesOpen(val); setMusicOpen(false); }}
                error={errors.movies}
              />
              <TextInputListItem 
                icon="heart-outline"
                title="Describe your ideal date"
                placeholder="E.g. Sunset walk, coffee & deep talks"
                value={date} onChangeText={(val) => { setDate(val); setErrors({...errors, date: null}); }}
                error={errors.date}
                maxLength={200}
              />
              <TextInputListItem 
                icon="restaurant-outline"
                title="Go-to food or place"
                placeholder="E.g. Sushi, Pizza or that cozy café"
                value={food} onChangeText={(val) => { setFood(val); setErrors({...errors, food: null}); }}
                error={errors.food}
                maxLength={200}
              />
            </View>

            {/* Section 2 Header */}
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={24} color="#FF4D67" style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.sectionTitle}>I'm looking for</Text>
                <Text style={styles.sectionSubtitle}>Choose what best describes you</Text>
              </View>
            </View>

            {/* Looking For Grid */}
            <View style={styles.lookingGrid}>
              <LookingForButton label="Long-term" icon="heart-outline" active={relationshipType === 'Long-term'} onPress={() => setRelationshipType('Long-term')} />
              <LookingForButton label="Short-term" icon="sparkles-outline" active={relationshipType === 'Short-term'} onPress={() => setRelationshipType('Short-term')} />
              <LookingForButton label="Friendship" icon="people-outline" active={relationshipType === 'Friendship'} onPress={() => setRelationshipType('Friendship')} />
              <LookingForButton label="Still exploring" icon="search-outline" active={relationshipType === 'Still exploring'} onPress={() => setRelationshipType('Still exploring')} />
            </View>

            {errors.api ? <Text style={[styles.errorText, { textAlign: 'center', marginLeft: 0, marginBottom: 10 }]}>{errors.api}</Text> : null}

            <TouchableOpacity onPress={handleComplete} activeOpacity={0.8} disabled={isSubmitting}>
              <LinearGradient colors={isSubmitting ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)'] : [COLORS.maroon, COLORS.burgundy]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>{isSubmitting ? 'Saving...' : 'Next Step'}</Text>
                {!isSubmitting && <Ionicons name="arrow-forward" size={W * 0.05} color="#fff" style={{ marginLeft: 8 }} />}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footerWrap}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.taupe} />
              <Text style={styles.footerText}>Your information is private and secure</Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A0E13' },
  content: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  
  headerRow: { paddingHorizontal: W * 0.06, flexDirection: 'row', alignItems: 'center', marginBottom: W * 0.06, marginTop: W * 0.02 },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: W * 0.04 },
  
  progressContainer: { flex: 1, position: 'relative', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', top: 9 },
  dotInactiveWrap: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  dotInactive: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActiveWrap: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255, 77, 103, 0.4)', justifyContent: 'center', alignItems: 'center' },
  dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4D67' },

  titleContainer: { paddingHorizontal: W * 0.06, marginBottom: W * 0.06 },
  title: { fontSize: W * 0.08, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: W * 0.035, color: 'rgba(255,255,255,0.6)' },

  scrollContent: { paddingHorizontal: W * 0.06, paddingBottom: W * 0.1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: W * 0.04 },
  sectionTitle: { fontSize: W * 0.045, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  sectionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: W * 0.035,
    padding: W * 0.04,
    marginBottom: W * 0.03,
  },
  listItemOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginRight: 12,
  },
  itemTextWrap: { flex: 1, justifyContent: 'center' },
  itemTitle: { fontSize: W * 0.035, color: '#fff', fontWeight: '600', marginBottom: 2 },
  itemSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  itemInput: { fontSize: 12, color: '#fff', padding: 0, margin: 0 },
  errorText: { color: '#FF4D67', fontSize: 12, marginTop: 4, marginBottom: W * 0.03, marginLeft: 8 },

  dropdownList: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 0,
    borderBottomLeftRadius: W * 0.035,
    borderBottomRightRadius: W * 0.035,
    overflow: 'hidden',
    marginBottom: W * 0.03,
  },
  dropdownOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: W * 0.03, paddingHorizontal: W * 0.05,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownOptionText: { fontSize: W * 0.035, color: COLORS.taupe },
  dropdownOptionTextActive: { color: '#fff', fontWeight: 'bold' },

  lookingGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: W * 0.08 },
  lookingBtn: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    padding: 4,
  },
  lookingBtnActive: { borderColor: '#FF4D67', backgroundColor: 'rgba(255, 77, 103, 0.05)' },
  lookingBtnText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontWeight: '500' },
  lookingBtnTextActive: { color: '#FF4D67', fontWeight: 'bold' },
  lookingCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 4,
    backgroundColor: '#FF4D67',
    justifyContent: 'center', alignItems: 'center',
  },

  primaryBtn: {
    paddingVertical: W * 0.04, borderRadius: W * 0.07,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: W * 0.045, fontWeight: 'bold' },

  footerWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: W * 0.06 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 6 },
});
