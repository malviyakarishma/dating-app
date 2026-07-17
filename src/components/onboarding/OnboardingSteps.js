import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Dimensions, Platform, ScrollView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../theme/colors';

const { width: W } = Dimensions.get('window');

const zodiacSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const musicGenres = ["Pop", "Rock", "Hip Hop", "Bollywood", "Punjabi", "EDM", "Jazz", "Classical", "Lo-fi", "Indie"];
const movieGenres = ["Action", "Comedy", "Romance", "Horror", "Thriller", "Sci-Fi", "Drama", "Adventure", "Animation", "Fantasy"];

// -- Reusable Components --

const SelectCard = ({ label, icon, active, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.selectCard, active && styles.selectCardActive]}>
    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
    <Ionicons name={icon} size={28} color={active ? '#FF4D67' : 'rgba(255,255,255,0.5)'} style={{ marginBottom: 12 }} />
    <Text style={[styles.selectCardText, active && styles.selectCardTextActive]}>{label}</Text>
    {active && (
      <View style={styles.checkIconWrap}>
        <Ionicons name="checkmark" size={14} color="#fff" />
      </View>
    )}
  </TouchableOpacity>
);

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, active && styles.chipActive]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const GlassInput = ({ icon, placeholder, value, onChangeText, keyboardType, maxLength, multiline }) => (
  <View style={styles.inputWrap}>
    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
    {icon && <Ionicons name={icon} size={20} color={COLORS.taupe} style={{ marginRight: 12 }} />}
    <TextInput
      style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.3)"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
      multiline={multiline}
    />
  </View>
);

// -- Steps --

export const GenderStep = ({ formData, updateForm }) => (
  <View style={styles.grid}>
    <SelectCard label="Female" icon="female" active={formData.gender === 'Female'} onPress={() => updateForm('gender', 'Female')} />
    <SelectCard label="Male" icon="male" active={formData.gender === 'Male'} onPress={() => updateForm('gender', 'Male')} />
    <SelectCard label="Other" icon="male-female" active={formData.gender === 'Other'} onPress={() => updateForm('gender', 'Other')} />
  </View>
);

export const DobStep = ({ formData, updateForm }) => {
  const [showPicker, setShowPicker] = useState(false);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  const onChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) updateForm('dob', selectedDate);
  };

  return (
    <View style={styles.centered}>
      <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.8} style={styles.dateDisplayWrap}>
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        <Ionicons name="calendar-outline" size={32} color={COLORS.pinkHighlight} style={{ marginBottom: 16 }} />
        <Text style={styles.dateLabel}>Date of Birth</Text>
        <Text style={styles.dateValue}>{formData.dob ? formData.dob.toLocaleDateString() : 'Tap to select'}</Text>
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker value={formData.dob || maxDate} mode="date" display="spinner" maximumDate={maxDate} onChange={onChange} textColor="#fff" />
        </View>
      )}
    </View>
  );
};

export const ZodiacStep = ({ formData, updateForm }) => (
  <ScrollView contentContainerStyle={styles.chipContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
    {zodiacSigns.map(sign => (
      <Chip key={sign} label={sign} active={formData.zodiac === sign} onPress={() => updateForm('zodiac', sign)} />
    ))}
  </ScrollView>
);

export const OccupationStep = ({ formData, updateForm }) => (
  <View>
    <GlassInput icon="briefcase-outline" placeholder="e.g. Software Engineer, Designer" value={formData.occupation} onChangeText={v => updateForm('occupation', v)} maxLength={100} />
    <View style={{ marginTop: 20 }}>
      <Text style={styles.helperText}>Suggested:</Text>
      <View style={styles.chipContainer}>
        {['Student', 'Engineer', 'Designer', 'Doctor', 'Entrepreneur', 'Artist'].map(job => (
          <Chip key={job} label={job} active={formData.occupation === job} onPress={() => updateForm('occupation', job)} />
        ))}
      </View>
    </View>
  </View>
);



export const CollegeLocationStep = ({ formData, updateForm }) => (
  <View>
    <Text style={styles.inputLabel}>Where did you go to school? (Optional)</Text>
    <GlassInput icon="school-outline" placeholder="University / College" value={formData.college} onChangeText={v => updateForm('college', v)} maxLength={100} />
    <View style={{ height: 24 }} />
    <Text style={styles.inputLabel}>Where do you live?</Text>
    <GlassInput icon="location-outline" placeholder="City, Country" value={formData.location} onChangeText={v => updateForm('location', v)} maxLength={100} />
  </View>
);

export const HeightWeightStep = ({ formData, updateForm }) => (
  <View>
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.inputLabel}>Height</Text>
        <View style={styles.inputWithUnit}>
          <TextInput style={styles.numberInput} placeholder="e.g. 5'11" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="numeric" value={formData.height} onChangeText={v => updateForm('height', v)} />
          <TouchableOpacity onPress={() => updateForm('heightUnit', formData.heightUnit === 'ft' ? 'cm' : 'ft')} style={styles.unitBtn}>
            <Text style={styles.unitText}>{formData.heightUnit}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ width: 16 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.inputLabel}>Weight</Text>
        <View style={styles.inputWithUnit}>
          <TextInput style={styles.numberInput} placeholder="e.g. 70" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="numeric" value={formData.weight} onChangeText={v => updateForm('weight', v)} />
          <TouchableOpacity onPress={() => updateForm('weightUnit', formData.weightUnit === 'kg' ? 'lbs' : 'kg')} style={styles.unitBtn}>
            <Text style={styles.unitText}>{formData.weightUnit}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

export const MusicMoviesStep = ({ formData, updateForm }) => {
  const toggleSelection = (key, val) => {
    const current = Array.isArray(formData[key]) ? formData[key] : [];
    if (current.includes(val)) {
      updateForm(key, current.filter(item => item !== val));
    } else {
      if (current.length >= 3) return; // Limit to 3
      updateForm(key, [...current, val]);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
      <Text style={styles.inputLabel}>Favorite Music Genres (Select up to 3)</Text>
      <View style={styles.chipContainer}>
        {musicGenres.map(m => (
          <Chip key={m} label={m} active={Array.isArray(formData.music) && formData.music.includes(m)} onPress={() => toggleSelection('music', m)} />
        ))}
      </View>
      <View style={{ height: 24 }} />
      <Text style={styles.inputLabel}>Favorite Movie Genres (Select up to 3)</Text>
      <View style={styles.chipContainer}>
        {movieGenres.map(m => (
          <Chip key={m} label={m} active={Array.isArray(formData.movies) && formData.movies.includes(m)} onPress={() => toggleSelection('movies', m)} />
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export const DateFoodStep = ({ formData, updateForm }) => (
  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
    <Text style={styles.inputLabel}>Describe your ideal date</Text>
    <GlassInput icon="heart-outline" placeholder="e.g. Coffee and a long walk" value={formData.date} onChangeText={v => updateForm('date', v)} maxLength={200} multiline />

    <View style={{ height: 24 }} />
    <Text style={styles.inputLabel}>Go-to food or place</Text>
    <GlassInput icon="restaurant-outline" placeholder="e.g. Late night pizza" value={formData.food} onChangeText={v => updateForm('food', v)} maxLength={200} multiline />
  </ScrollView>
);

export const LookingForStep = ({ formData, updateForm }) => (
  <View style={styles.grid}>
    <SelectCard label="Long-term" icon="heart" active={formData.relationshipType === 'Long-term'} onPress={() => updateForm('relationshipType', 'Long-term')} />
    <SelectCard label="Short-term" icon="sparkles" active={formData.relationshipType === 'Short-term'} onPress={() => updateForm('relationshipType', 'Short-term')} />
    <SelectCard label="Friendship" icon="people" active={formData.relationshipType === 'Friendship'} onPress={() => updateForm('relationshipType', 'Friendship')} />
    <SelectCard label="Still exploring" icon="compass" active={formData.relationshipType === 'Still exploring'} onPress={() => updateForm('relationshipType', 'Still exploring')} />
  </View>
);

export const PhotosBioStep = ({ formData, updateForm, error, setError }) => {
  const handlePickImage = async () => {
    if (formData.photos.length >= 6) {
      setError("You can only upload up to 6 photos.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const maxSelectable = 6 - formData.photos.length;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsMultipleSelection: true, 
      selectionLimit: maxSelectable, 
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      const newPhotos = [...formData.photos, ...selectedUris].slice(0, 6);
      updateForm('photos', newPhotos);
      setError(null);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    updateForm('photos', newPhotos);
    if (newPhotos.length >= 3) setError(null);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
      <Text style={styles.inputLabel}>Upload 3 to 6 photos</Text>
      <View style={styles.photoGrid}>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const photoUri = formData.photos[index];
          return (
            <View key={index} style={styles.photoSlotWrap}>
              {photoUri ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)} activeOpacity={0.8}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.emptySlot, error && index < 3 && formData.photos.length < 3 ? { borderColor: '#FF4D67' } : {}]} onPress={handlePickImage} activeOpacity={0.8}>
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                  <Ionicons name="add" size={32} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <Text style={styles.inputLabel}>About You (Optional)</Text>
      <GlassInput placeholder="Write a short bio about yourself..." value={formData.bio} onChangeText={v => updateForm('bio', v)} maxLength={500} multiline />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};


// -- Styles --

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: W * 0.04,
  },
  selectCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  selectCardActive: {
    borderColor: COLORS.pinkHighlight,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    shadowColor: COLORS.pinkHighlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  selectCardText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  selectCardTextActive: {
    color: '#fff',
  },
  checkIconWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.pinkHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    alignItems: 'center',
    marginTop: 20,
  },
  dateDisplayWrap: {
    width: '100%',
    paddingVertical: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  dateLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 8,
  },
  dateValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginTop: 20,
    overflow: 'hidden',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.pinkHighlight,
  },
  chipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    overflow: 'hidden',
    minHeight: 56,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  helperText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 56,
    paddingLeft: 16,
    paddingRight: 6,
  },
  numberInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  unitBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  unitText: {
    color: '#fff',
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  photoSlotWrap: {
    width: '31%',
    aspectRatio: 0.75,
    marginBottom: W * 0.04,
  },
  emptySlot: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4D67',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a0a0e',
  },
});
