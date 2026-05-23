import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../theme/colors';
import { validateRequired } from '../utils/validators';

const { width: W } = Dimensions.get('window');

const zodiacSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

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

const SelectionButton = ({ label, icon, active, onPress, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.selectBtn,
      active && styles.selectBtnActive,
      style
    ]}
  >
    <View style={styles.selectBtnContent}>
      <Ionicons name={icon} size={W * 0.045} color={active ? '#fff' : COLORS.taupe} style={{ marginRight: 6 }} />
      <Text style={[styles.selectBtnText, active && styles.selectBtnTextActive]}>{label}</Text>
    </View>
    {active && <Ionicons name="checkmark-circle" size={W * 0.045} color="#FF4D67" />}
  </TouchableOpacity>
);

export default function ProfileSetupStep1Screen({ navigation }) {
  const [gender, setGender] = useState('Female');
  const [dob, setDob] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [zodiac, setZodiac] = useState('');
  const [zodiacOpen, setZodiacOpen] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [isStudent, setIsStudent] = useState('Yes');
  const [college, setCollege] = useState('');
  const [location, setLocation] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  const [heightUnit, setHeightUnit] = useState('ft');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [errors, setErrors] = useState({});

  const handleNext = () => {
    let valid = true;
    let newErrors = {};

    newErrors.dob = validateRequired(dob, "Date of Birth is required");
    newErrors.zodiac = validateRequired(zodiac, "Zodiac sign is required");
    newErrors.occupation = validateRequired(occupation, "Occupation is required");
    newErrors.location = validateRequired(location, "Location is required");
    newErrors.height = validateRequired(height, "Height is required");
    newErrors.weight = validateRequired(weight, "Weight is required");

    if (newErrors.dob || newErrors.zodiac || newErrors.occupation || newErrors.location || newErrors.height || newErrors.weight) {
      valid = false;
    }

    setErrors(newErrors);
    if (valid) {
      navigation.navigate('ProfileSetupStep2');
    }
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDob(selectedDate);
      setErrors({ ...errors, dob: null });
    }
  };

  const formattedDob = dob ? dob.toLocaleDateString() : 'Date of Birth (DD/MM/YYYY)';

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

            {/* Progress Bar (3 dots) */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLine} />
              <View style={[styles.progressLine, { backgroundColor: '#FF4D67', width: '0%', zIndex: 2 }]} />
              {[0, 1, 2].map((step, index) => {
                const isActive = index === 0;
                return (
                  <View key={step} style={[isActive ? styles.dotActiveWrap : styles.dotInactiveWrap, { zIndex: 3 }]}>
                    <View style={isActive ? styles.dotActive : styles.dotInactive} />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>About You</Text>
            <Text style={styles.subtitle}>Help us personalize your experience</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Group 1: I identify as & Zodiac */}
            <View style={[styles.card, { zIndex: 10 }]}>
              <Text style={styles.label}>I identify as</Text>
              <View style={[styles.row, { marginBottom: W * 0.05 }]}>
                <SelectionButton label="Male" icon="male" active={gender === 'Male'} onPress={() => setGender('Male')} style={{ flex: 1 }} />
                <View style={{ width: 8 }} />
                <SelectionButton label="Female" icon="female" active={gender === 'Female'} onPress={() => setGender('Female')} style={{ flex: 1.2 }} />
                <View style={{ width: 8 }} />
                <SelectionButton label="Other" icon="male-female" active={gender === 'Other'} onPress={() => setGender('Other')} style={{ flex: 1 }} />
              </View>

              <TouchableOpacity 
                style={[styles.listItem, { marginBottom: W * 0.05 }, errors.dob && { borderColor: '#FF4D67' }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <View style={styles.iconBox}>
                  <Ionicons name="calendar-outline" size={20} color="#FF4D67" />
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle}>Date of Birth</Text>
                  <Text style={[styles.itemSubtitle, dob && { color: '#fff' }]}>
                    {dob ? formattedDob : 'DD/MM/YYYY'}
                  </Text>
                </View>
              </TouchableOpacity>
              {errors.dob ? <Text style={[styles.errorText, { marginTop: -15, marginBottom: 15 }]}>{errors.dob}</Text> : null}
              
              {showDatePicker && (
                <DateTimePicker
                  value={dob || maxDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={maxDate}
                  onChange={onDateChange}
                />
              )}

              <DropdownListItem 
                icon="moon-outline"
                title="Zodiac sign"
                placeholder="Choose your sign"
                value={zodiac} onSelect={(val) => { setZodiac(val); setErrors({...errors, zodiac: null}); }}
                options={zodiacSigns}
                open={zodiacOpen} setOpen={setZodiacOpen}
                error={errors.zodiac}
              />
            </View>

            {/* Group 2: Occupation */}
            <View style={[styles.card, errors.occupation && { borderColor: '#FF4D67' }]}>
              <Text style={styles.label}>What's your occupation?</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="briefcase-outline" size={W * 0.05} color={COLORS.taupe} />
                <TextInput
                  style={styles.input} placeholder="e.g. Software Engineer"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={occupation} onChangeText={(val) => { setOccupation(val); setErrors({...errors, occupation: null}); }}
                  maxLength={200}
                />
              </View>
              {errors.occupation ? <Text style={styles.errorText}>{errors.occupation}</Text> : null}
            </View>

            {/* Group 3: Student */}
            <View style={styles.card}>
              <Text style={styles.label}>Are you a student?</Text>
              <View style={styles.row}>
                <SelectionButton label="Yes" icon="school-outline" active={isStudent === 'Yes'} onPress={() => setIsStudent('Yes')} style={{ flex: 1 }} />
                <View style={{ width: 12 }} />
                <SelectionButton label="No" icon="person-outline" active={isStudent === 'No'} onPress={() => setIsStudent('No')} style={{ flex: 1 }} />
              </View>
            </View>

            {/* Group 4: College & Location */}
            <View style={[styles.card, errors.location && { borderColor: '#FF4D67' }]}>
              <Text style={styles.label}>College / University <Text style={styles.optional}>(Optional)</Text></Text>
              <View style={styles.inputWrap}>
                <Ionicons name="business-outline" size={W * 0.05} color={COLORS.taupe} />
                <TextInput
                  style={styles.input} placeholder="Search your college / university"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={college} onChangeText={setCollege}
                  maxLength={200}
                />
              </View>

              <View style={styles.divider} />

              <Text style={styles.label}>Where do you live?</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="location-outline" size={W * 0.05} color={COLORS.taupe} />
                <TextInput
                  style={styles.input} placeholder="City, Country"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={location} onChangeText={(val) => { setLocation(val); setErrors({...errors, location: null}); }}
                  maxLength={200}
                />
              </View>
              {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
            </View>

            {/* Group 5: Height & Weight */}
            <View style={[styles.row, { zIndex: 1 }]}>
              <View style={[styles.card, { flex: 1, padding: W * 0.035 }, errors.height && { borderColor: '#FF4D67' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="pencil-outline" size={W * 0.05} color={COLORS.taupe} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={[styles.label, { marginBottom: 2, fontSize: 12 }]}>Height</Text>
                    <TextInput
                      style={[styles.input, { paddingVertical: 0, marginLeft: 0, fontSize: 14 }]} 
                      placeholder="e.g. 5'11"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={height} onChangeText={(val) => { setHeight(val.replace(/[^0-9.]/g, '')); setErrors({...errors, height: null}); }}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.unitSelector} 
                    activeOpacity={0.8}
                    onPress={() => setHeightUnit(prev => prev === 'ft' ? 'cm' : 'ft')}
                  >
                    <Text style={styles.unitText}>{heightUnit}</Text>
                  </TouchableOpacity>
                </View>
                {errors.height ? <Text style={styles.errorText}>{errors.height}</Text> : null}
              </View>
              
              <View style={{ width: 12 }} />
              
              <View style={[styles.card, { flex: 1, padding: W * 0.035 }, errors.weight && { borderColor: '#FF4D67' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="bag-handle-outline" size={W * 0.05} color={COLORS.taupe} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={[styles.label, { marginBottom: 2, fontSize: 12 }]}>Weight</Text>
                    <TextInput
                      style={[styles.input, { paddingVertical: 0, marginLeft: 0, fontSize: 14 }]} 
                      placeholder="e.g. 70"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={weight} onChangeText={(val) => { setWeight(val.replace(/[^0-9.]/g, '')); setErrors({...errors, weight: null}); }}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.unitSelector}
                    activeOpacity={0.8}
                    onPress={() => setWeightUnit(prev => prev === 'kg' ? 'lbs' : 'kg')}
                  >
                    <Text style={styles.unitText}>{weightUnit}</Text>
                  </TouchableOpacity>
                </View>
                {errors.weight ? <Text style={styles.errorText}>{errors.weight}</Text> : null}
              </View>
            </View>

            <TouchableOpacity onPress={handleNext} activeOpacity={0.8} style={{ zIndex: 1 }}>
              <LinearGradient colors={[COLORS.maroon, COLORS.burgundy]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Next Step</Text>
                <Ionicons name="arrow-forward" size={W * 0.05} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.footerWrap, { zIndex: 1 }]}>
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
  title: { fontSize: W * 0.08, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: W * 0.035, color: 'rgba(255,255,255,0.6)' },

  scrollContent: { paddingHorizontal: W * 0.06, paddingBottom: W * 0.1 },
  
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: W * 0.04,
    padding: W * 0.045,
    marginBottom: W * 0.04,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  label: { fontSize: W * 0.035, color: '#fff', fontWeight: '700', marginBottom: W * 0.03 },
  optional: { color: 'rgba(255,255,255,0.4)', fontWeight: '400' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: W * 0.035, paddingHorizontal: W * 0.03,
    borderRadius: W * 0.03, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  selectBtnActive: { borderColor: '#FF4D67', backgroundColor: 'rgba(255, 77, 103, 0.05)' },
  selectBtnContent: { flexDirection: 'row', alignItems: 'center' },
  selectBtnText: { color: '#fff', fontSize: W * 0.035, fontWeight: '500' },
  selectBtnTextActive: { color: '#fff' },

  inputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, borderWidth: 0 },
  input: { flex: 1, paddingVertical: 0, fontSize: W * 0.035, color: '#fff', marginLeft: W * 0.03 },
  errorText: { color: '#FF4D67', fontSize: 12, marginTop: 8 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: W * 0.04 },

  unitSelector: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6,
  },
  unitText: { color: '#fff', fontSize: 12 },

  primaryBtn: {
    paddingVertical: W * 0.04, borderRadius: W * 0.07,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: W * 0.04,
  },
  primaryBtnText: { color: '#fff', fontSize: W * 0.045, fontWeight: 'bold' },

  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 6 },
  
  listItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: W * 0.035,
    padding: W * 0.04,
  },
  listItemOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  iconBox: {
    width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', marginRight: 12,
  },
  itemTextWrap: { flex: 1, justifyContent: 'center' },
  itemTitle: { fontSize: W * 0.035, color: '#fff', fontWeight: '600', marginBottom: 2 },
  itemSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  
  dropdownList: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 0, borderBottomLeftRadius: W * 0.035, borderBottomRightRadius: W * 0.035, overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: W * 0.03, paddingHorizontal: W * 0.05, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownOptionText: { fontSize: W * 0.035, color: COLORS.taupe },
  dropdownOptionTextActive: { color: COLORS.maroon, fontWeight: 'bold' },
});
