import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator,
  Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width: W } = Dimensions.get('window');

const TABS = ['Basic Info', 'Interests', 'Photos & Bio'];

const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const musicGenres = ['Pop', 'Rock', 'Hip Hop', 'Bollywood', 'Punjabi', 'EDM', 'Jazz', 'Classical', 'Lo-fi', 'Indie'];
const movieGenres = ['Action', 'Comedy', 'Romance', 'Horror', 'Thriller', 'Sci-Fi', 'Drama', 'Adventure', 'Animation', 'Fantasy'];

// ─── Reusable sub-components ─────────────────────────────────────────────────

const SelectionButton = ({ label, icon, active, onPress, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.selectBtn, active && styles.selectBtnActive, style]}
  >
    <View style={styles.selectBtnContent}>
      <Ionicons name={icon} size={W * 0.04} color={active ? '#fff' : COLORS.taupe} style={{ marginRight: 5 }} />
      <Text style={[styles.selectBtnText, active && styles.selectBtnTextActive]}>{label}</Text>
    </View>
    {active && <Ionicons name="checkmark-circle" size={W * 0.04} color="#FF4D67" />}
  </TouchableOpacity>
);

const DropdownField = ({ icon, title, placeholder, value, onSelect, options, open, setOpen, error }) => (
  <View style={{ zIndex: open ? 200 : 1, marginBottom: W * 0.04 }}>
    <TouchableOpacity
      style={[styles.dropdownTrigger, open && styles.dropdownTriggerOpen, error && { borderColor: '#FF4D67' }]}
      activeOpacity={0.8}
      onPress={() => setOpen(!open)}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color="#FF4D67" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{title}</Text>
        <Text style={[styles.fieldValue, value && { color: '#fff' }]}>{value || placeholder}</Text>
      </View>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
    {open && (
      <View style={styles.dropdownList}>
        <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropdownOption, i === options.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[styles.dropdownOptionText, value === opt && styles.dropdownOptionTextActive]}>{opt}</Text>
              {value === opt && <Ionicons name="checkmark" size={16} color="#FF4D67" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )}
    {error && !open && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const InputField = ({ icon, label, placeholder, value, onChangeText, multiline, keyboardType, maxLength, rightElement, error }) => (
  <View style={{ marginBottom: W * 0.04 }}>
    <View style={[styles.inputField, error && { borderColor: '#FF4D67' }, multiline && { alignItems: 'flex-start', paddingTop: 14 }]}>
      <View style={[styles.iconBox, multiline && { marginTop: 2 }]}>
        <Ionicons name={icon} size={18} color="#FF4D67" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={[styles.fieldInput, multiline && { minHeight: 70 }]}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          keyboardType={keyboardType || 'default'}
          maxLength={maxLength}
        />
      </View>
      {rightElement}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const LookingForButton = ({ label, icon, active, onPress }) => (
  <TouchableOpacity style={[styles.lookingBtn, active && styles.lookingBtnActive]} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name={icon} size={22} color={active ? '#FF4D67' : 'rgba(255,255,255,0.5)'} style={{ marginBottom: 4 }} />
    <Text style={[styles.lookingBtnText, active && styles.lookingBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    {active && (
      <View style={styles.lookingCheck}>
        <Ionicons name="checkmark" size={9} color="#fff" />
      </View>
    )}
  </TouchableOpacity>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const { user, updateProfileStep, uploadPhotos } = useAuth();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState(0);
  const tabAnim = useRef(new Animated.Value(0)).current;

  // ── Tab 1 state ──
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState(user?.gender || 'Female');
  const [dob, setDob] = useState(user?.dob ? new Date(user.dob) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [zodiac, setZodiac] = useState(user?.zodiac || '');
  const [zodiacOpen, setZodiacOpen] = useState(false);
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [isStudent, setIsStudent] = useState(user?.isStudent || 'Yes');
  const [college, setCollege] = useState(user?.college || '');
  const [location, setLocation] = useState(user?.location || '');
  const [height, setHeight] = useState(user?.height || '');
  const [heightUnit, setHeightUnit] = useState(user?.heightUnit || 'ft');
  const [weight, setWeight] = useState(user?.weight || '');
  const [weightUnit, setWeightUnit] = useState(user?.weightUnit || 'kg');

  // ── Tab 2 state ──
  const [music, setMusic] = useState(user?.music || '');
  const [musicOpen, setMusicOpen] = useState(false);
  const [movies, setMovies] = useState(user?.movies || '');
  const [moviesOpen, setMoviesOpen] = useState(false);
  const [idealDate, setIdealDate] = useState(user?.date || '');
  const [food, setFood] = useState(user?.food || '');
  const [relationshipType, setRelationshipType] = useState(user?.relationshipType || 'Long-term');

  // ── Tab 3 state ──
  const [photos, setPhotos] = useState(user?.photos || []);
  const [bio, setBio] = useState(user?.bio || '');

  // ── Shared state ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  const switchTab = (index) => {
    setActiveTab(index);
    setError(null);
    setSuccess(false);
    Animated.spring(tabAnim, { toValue: index, useNativeDriver: false, bounciness: 4 }).start();
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDob(selectedDate);
  };

  const formattedDob = dob
    ? dob.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Select date of birth';

  // ── Photo handling ──
  const handlePickImage = async () => {
    if (photos.length >= 6) {
      setError('You can only have up to 6 photos.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
      setError(null);
    }
  };

  // Instantly remove from local state — backend will diff & delete from Cloudinary on Save
  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  // ── Save handlers ──
  const handleSaveTab1 = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await updateProfileStep({
        name: name.trim(),
        gender,
        dob,
        zodiac,
        occupation: occupation.trim(),
        isStudent,
        college: college.trim(),
        location: location.trim(),
        height: height.toString(),
        heightUnit,
        weight: weight.toString(),
        weightUnit,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTab2 = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await updateProfileStep({
        music,
        movies,
        date: idealDate.trim(),
        food: food.trim(),
        relationshipType,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTab3 = async () => {
    if (photos.length < 3) {
      setError('Please keep at least 3 photos.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);

      // Separate local vs already-uploaded
      const localPhotos = photos.filter(p => !p.startsWith('http'));
      const cloudinaryPhotos = photos.filter(p => p.startsWith('http'));

      let finalPhotos = [...cloudinaryPhotos];
      if (localPhotos.length > 0) {
        const newUrls = await uploadPhotos(localPhotos);
        finalPhotos = [...finalPhotos, ...newUrls];
      }

      await updateProfileStep({
        photos: finalPhotos,
        bio: bio.trim(),
      });

      setPhotos(finalPhotos);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    if (activeTab === 0) handleSaveTab1();
    else if (activeTab === 1) handleSaveTab2();
    else handleSaveTab3();
  };

  // ─── Render Tab Content ───────────────────────────────────────────────────

  const renderTab1 = () => (
    <View>
      {/* Name */}
      <InputField
        icon="person-outline"
        label="Name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        maxLength={100}
      />

      {/* Gender */}
      <View style={{ marginBottom: W * 0.04 }}>
        <Text style={styles.sectionLabel}>I identify as</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SelectionButton label="Male" icon="male" active={gender === 'Male'} onPress={() => setGender('Male')} style={{ flex: 1 }} />
          <SelectionButton label="Female" icon="female" active={gender === 'Female'} onPress={() => setGender('Female')} style={{ flex: 1.1 }} />
          <SelectionButton label="Other" icon="male-female" active={gender === 'Other'} onPress={() => setGender('Other')} style={{ flex: 1 }} />
        </View>
      </View>

      {/* Date of Birth */}
      <View style={{ marginBottom: W * 0.04 }}>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.iconBox}>
            <Ionicons name="calendar-outline" size={18} color="#FF4D67" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <Text style={[styles.fieldValue, dob && { color: '#fff' }]}>{formattedDob}</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dob || maxDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maxDate}
            onChange={onDateChange}
          />
        )}
      </View>

      {/* Zodiac */}
      <DropdownField
        icon="moon-outline"
        title="Zodiac Sign"
        placeholder="Choose your sign"
        value={zodiac}
        onSelect={setZodiac}
        options={zodiacSigns}
        open={zodiacOpen}
        setOpen={setZodiacOpen}
      />

      {/* Occupation */}
      <InputField
        icon="briefcase-outline"
        label="Occupation"
        placeholder="e.g. Software Engineer"
        value={occupation}
        onChangeText={setOccupation}
        maxLength={200}
      />

      {/* Student */}
      <View style={{ marginBottom: W * 0.04 }}>
        <Text style={styles.sectionLabel}>Are you a student?</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SelectionButton label="Yes" icon="school-outline" active={isStudent === 'Yes'} onPress={() => setIsStudent('Yes')} style={{ flex: 1 }} />
          <SelectionButton label="No" icon="person-outline" active={isStudent === 'No'} onPress={() => setIsStudent('No')} style={{ flex: 1 }} />
        </View>
      </View>

      {/* College */}
      <InputField
        icon="business-outline"
        label={<>College / University <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>(Optional)</Text></>}
        placeholder="Search your college"
        value={college}
        onChangeText={setCollege}
        maxLength={200}
      />

      {/* Location */}
      <InputField
        icon="location-outline"
        label="Where do you live?"
        placeholder="City, Country"
        value={location}
        onChangeText={setLocation}
        maxLength={200}
      />

      {/* Height & Weight */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: W * 0.04 }}>
        <View style={[styles.inputField, { flex: 1, alignItems: 'center', flexDirection: 'row' }]}>
          <View style={styles.iconBox}>
            <Ionicons name="resize-outline" size={16} color="#FF4D67" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Height</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 170"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={height}
              onChangeText={val => setHeight(val.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <TouchableOpacity
            style={styles.unitBtn}
            onPress={() => setHeightUnit(prev => prev === 'ft' ? 'cm' : 'ft')}
          >
            <Text style={styles.unitText}>{heightUnit}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputField, { flex: 1, alignItems: 'center', flexDirection: 'row' }]}>
          <View style={styles.iconBox}>
            <Ionicons name="scale-outline" size={16} color="#FF4D67" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Weight</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 65"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={weight}
              onChangeText={val => setWeight(val.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <TouchableOpacity
            style={styles.unitBtn}
            onPress={() => setWeightUnit(prev => prev === 'kg' ? 'lbs' : 'kg')}
          >
            <Text style={styles.unitText}>{weightUnit}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTab2 = () => (
    <View>
      {/* Music */}
      <DropdownField
        icon="musical-notes-outline"
        title="Favorite Music Genre"
        placeholder="Choose your favorite"
        value={music}
        onSelect={setMusic}
        options={musicGenres}
        open={musicOpen}
        setOpen={(val) => { setMusicOpen(val); setMoviesOpen(false); }}
      />

      {/* Movies */}
      <DropdownField
        icon="film-outline"
        title="Favorite Movie Genre"
        placeholder="Choose your favorite"
        value={movies}
        onSelect={setMovies}
        options={movieGenres}
        open={moviesOpen}
        setOpen={(val) => { setMoviesOpen(val); setMusicOpen(false); }}
      />

      {/* Ideal Date */}
      <InputField
        icon="heart-outline"
        label="Describe your ideal date"
        placeholder="e.g. Sunset walk, coffee & deep talks"
        value={idealDate}
        onChangeText={setIdealDate}
        multiline
        maxLength={500}
      />

      {/* Food */}
      <InputField
        icon="restaurant-outline"
        label="Go-to food or place"
        placeholder="e.g. Sushi, Pizza or that cozy café"
        value={food}
        onChangeText={setFood}
        maxLength={200}
      />

      {/* Relationship Type */}
      <View style={{ marginBottom: W * 0.04 }}>
        <Text style={styles.sectionLabel}>I'm looking for</Text>
        <View style={styles.lookingGrid}>
          <LookingForButton label="Long-term" icon="heart-outline" active={relationshipType === 'Long-term'} onPress={() => setRelationshipType('Long-term')} />
          <LookingForButton label="Short-term" icon="sparkles-outline" active={relationshipType === 'Short-term'} onPress={() => setRelationshipType('Short-term')} />
          <LookingForButton label="Friendship" icon="people-outline" active={relationshipType === 'Friendship'} onPress={() => setRelationshipType('Friendship')} />
          <LookingForButton label="Exploring" icon="search-outline" active={relationshipType === 'Still exploring'} onPress={() => setRelationshipType('Still exploring')} />
        </View>
      </View>
    </View>
  );

  const renderTab3 = () => (
    <View>
      <Text style={styles.sectionLabel}>Your Photos <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '400', fontSize: 12 }}>(3–6 required)</Text></Text>
      <View style={styles.photoGrid}>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const photoUri = photos[index];
          return (
            <View key={index} style={styles.photoSlot}>
              {photoUri ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemovePhoto(index)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={13} color="#fff" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={styles.emptySlot} onPress={handlePickImage} activeOpacity={0.8}>
                  <Ionicons name="add" size={W * 0.07} color="rgba(255,255,255,0.3)" />
                  {index === 0 && <Text style={styles.emptySlotText}>Main</Text>}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Bio */}
      <View style={{ marginTop: W * 0.05 }}>
        <Text style={styles.sectionLabel}>About You <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '400', fontSize: 12 }}>(Optional)</Text></Text>
        <View style={[styles.inputField, { alignItems: 'flex-start', paddingTop: 14 }]}>
          <View style={[styles.iconBox, { marginTop: 2 }]}>
            <Ionicons name="document-text-outline" size={18} color="#FF4D67" />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.fieldInput, { minHeight: 100 }]}
              placeholder="Write a short bio about yourself..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={bio}
              onChangeText={setBio}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'right', marginTop: 4 }}>{bio.length}/500</Text>
      </View>
    </View>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.headerWrap}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={W * 0.055} color={COLORS.cream} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: W * 0.1 }} />
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            {TABS.map((tab, i) => (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => switchTab(i)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
                {activeTab === i && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 0 && renderTab1()}
            {activeTab === 1 && renderTab2()}
            {activeTab === 2 && renderTab3()}

            {/* Feedback */}
            {error ? (
              <View style={styles.feedbackRow}>
                <Ionicons name="alert-circle" size={16} color="#FF4D67" />
                <Text style={styles.errorFeedback}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={[styles.feedbackRow, { backgroundColor: 'rgba(80,200,120,0.12)', borderColor: 'rgba(80,200,120,0.3)' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                <Text style={[styles.errorFeedback, { color: '#50C878' }]}>Saved successfully!</Text>
              </View>
            ) : null}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isSubmitting ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)'] : [COLORS.maroon, COLORS.burgundy]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },

  // Header
  headerWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: W * 0.04, paddingTop: W * 0.02, paddingBottom: W * 0.03,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: W * 0.048, fontWeight: '700', color: '#fff' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', paddingHorizontal: W * 0.04,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 2,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingBottom: W * 0.03, position: 'relative' },
  tabText: { fontSize: W * 0.032, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2, borderRadius: 1, backgroundColor: '#FF4D67',
  },

  scrollContent: { padding: W * 0.045, paddingBottom: 60 },

  sectionLabel: {
    color: '#fff', fontSize: W * 0.035, fontWeight: '700',
    marginBottom: W * 0.025,
  },

  // Selection button (gender, student)
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: W * 0.03, paddingHorizontal: W * 0.03,
    borderRadius: W * 0.03, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  selectBtnActive: { borderColor: '#FF4D67', backgroundColor: 'rgba(255,77,103,0.08)' },
  selectBtnContent: { flexDirection: 'row', alignItems: 'center' },
  selectBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: W * 0.033, fontWeight: '500' },
  selectBtnTextActive: { color: '#fff' },

  // Input Field
  inputField: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: W * 0.035, paddingHorizontal: 12, paddingVertical: 12,
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,77,103,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,77,103,0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  fieldLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  fieldValue: { fontSize: W * 0.035, color: 'rgba(255,255,255,0.4)' },
  fieldInput: { color: '#fff', fontSize: W * 0.035, padding: 0, margin: 0 },

  // Dropdown
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: W * 0.035, paddingHorizontal: 12, paddingVertical: 12,
  },
  dropdownTriggerOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  dropdownList: {
    backgroundColor: 'rgba(30,10,15,0.97)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 0,
    borderBottomLeftRadius: W * 0.035, borderBottomRightRadius: W * 0.035,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: W * 0.028, paddingHorizontal: W * 0.04,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownOptionText: { fontSize: W * 0.035, color: 'rgba(255,255,255,0.6)' },
  dropdownOptionTextActive: { color: '#fff', fontWeight: 'bold' },

  // Unit button (height/weight)
  unitBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,77,103,0.15)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,77,103,0.3)',
  },
  unitText: { color: '#FF4D67', fontSize: 12, fontWeight: '700' },

  // Looking For
  lookingGrid: { flexDirection: 'row', gap: 8 },
  lookingBtn: {
    flex: 1, aspectRatio: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 4,
  },
  lookingBtnActive: { borderColor: '#FF4D67', backgroundColor: 'rgba(255,77,103,0.08)' },
  lookingBtnText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontWeight: '500' },
  lookingBtnTextActive: { color: '#FF4D67', fontWeight: 'bold' },
  lookingCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 14, height: 14, borderRadius: 4,
    backgroundColor: '#FF4D67', justifyContent: 'center', alignItems: 'center',
  },

  // Photos
  photoGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 4,
  },
  photoSlot: { width: '31%', aspectRatio: 0.75, marginBottom: W * 0.035 },
  photoContainer: { flex: 1, borderRadius: 12, overflow: 'visible' },
  photo: { width: '100%', height: '100%', borderRadius: 12 },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FF4D67',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#1a0a0e', zIndex: 10,
  },
  deletingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  mainBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(255,77,103,0.85)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  mainBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  emptySlot: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  emptySlotText: {
    position: 'absolute', bottom: 6,
    fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700',
  },

  // Feedback
  feedbackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,77,103,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,77,103,0.25)',
    borderRadius: 10, padding: 12, marginBottom: 12,
  },
  errorFeedback: { color: '#FF4D67', fontSize: 13, flex: 1 },
  errorText: { color: '#FF4D67', fontSize: 12, marginTop: 4, marginLeft: 4 },

  // Save button
  saveBtn: { borderRadius: W * 0.08, overflow: 'hidden', marginTop: W * 0.06 },
  saveBtnGradient: {
    flexDirection: 'row', paddingVertical: W * 0.04,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: W * 0.042, fontWeight: 'bold' },
});
