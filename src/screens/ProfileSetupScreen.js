import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import OnboardingBackground from '../components/onboarding/OnboardingBackground';
import {
  GenderStep, DobStep, ZodiacStep, OccupationStep, StudentStep,
  CollegeLocationStep, HeightWeightStep, MusicMoviesStep,
  DateFoodStep, LookingForStep, PhotosBioStep
} from '../components/onboarding/OnboardingSteps';

const { width: W, height: H } = Dimensions.get('window');

const STEPS = [
  { id: 'gender', title: "I identify as", subtitle: "Be proud of who you are" },
  { id: 'dob', title: "My date of birth is", subtitle: "We need this to verify your age" },
  { id: 'zodiac', title: "My zodiac sign is", subtitle: "Written in the stars" },
  { id: 'occupation', title: "What's your occupation?", subtitle: "Tell us what you do" },
  { id: 'student', title: "Are you a student?", subtitle: "Uni life or working professional?" },
  { id: 'college_location', title: "Where are you based?", subtitle: "Help us find matches near you" },
  { id: 'height_weight', title: "Your height and weight", subtitle: "Just the physical details" },
  { id: 'music_movies', title: "Your entertainment vibe", subtitle: "What are we watching/listening to?" },
  { id: 'date_food', title: "Ideal dates & food", subtitle: "Set the perfect scene" },
  { id: 'looking_for', title: "I'm looking for", subtitle: "What's your intention?" },
  { id: 'photos_bio', title: "Show your best self", subtitle: "Add your favorite photos" },
];

export default function ProfileSetupScreen({ navigation }) {
  const { user, updateProfileStep, uploadPhotos } = useAuth();

  // -- Form State --
  const [formData, setFormData] = useState({
    gender: user?.gender || 'Female',
    dob: user?.dob ? new Date(user.dob) : null,
    zodiac: user?.zodiac || '',
    occupation: user?.occupation || '',
    isStudent: user?.isStudent || 'Yes',
    college: user?.college || '',
    location: user?.location || '',
    height: user?.height || '',
    weight: user?.weight || '',
    heightUnit: user?.heightUnit || 'ft',
    weightUnit: user?.weightUnit || 'kg',
    music: user?.music || '',
    movies: user?.movies || '',
    date: user?.date || '',
    food: user?.food || '',
    relationshipType: user?.relationshipType || 'Long-term',
    photos: user?.photos || [],
    bio: user?.bio || '',
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // -- Helper: Find Initial Step --
  const getInitialStepIndex = (u) => {
    if (!u) return 0;
    if (!u.gender) return 0;
    if (!u.dob) return 1;
    if (!u.zodiac) return 2;
    if (!u.occupation) return 3;
    if (!u.isStudent) return 4;
    if (!u.location) return 5;
    if (!u.height || !u.weight) return 6;
    if (!u.music || !u.movies) return 7;
    if (!u.date || !u.food) return 8;
    if (!u.relationshipType) return 9;
    if (!u.photos || u.photos.length < 3) return 10;
    return 0;
  };

  const initialIndex = getInitialStepIndex(user);

  // -- UI State --
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const flatListRef = useRef(null);
  const progressWidth = useSharedValue(initialIndex / STEPS.length);

  useEffect(() => {
    progressWidth.value = withTiming((currentIndex + 1) / STEPS.length, { duration: 400 });
  }, [currentIndex]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value * 100}%`,
    };
  });

  const validateCurrentStep = () => {
    setError(null);
    const step = STEPS[currentIndex];
    switch (step.id) {
      case 'dob':
        if (!formData.dob) return "Date of Birth is required.";
        break;
      case 'zodiac':
        if (!formData.zodiac) return "Zodiac sign is required.";
        break;
      case 'occupation':
        if (!formData.occupation) return "Occupation is required.";
        break;
      case 'college_location':
        if (!formData.location) return "Location is required.";
        break;
      case 'height_weight':
        if (!formData.height) return "Height is required.";
        if (!formData.weight) return "Weight is required.";
        break;
      case 'music_movies':
        if (!formData.music || !formData.movies) return "Please complete this section.";
        break;
      case 'date_food':
        if (!formData.date || !formData.food) return "Please complete this section.";
        break;
      case 'photos_bio':
        if (formData.photos.length < 3) return "Please upload at least 3 photos.";
        break;
    }
    return null;
  };

  const handleNext = async () => {
    Keyboard.dismiss();
    const errMsg = validateCurrentStep();
    if (errMsg) {
      setError(errMsg);
      return;
    }

    if (currentIndex < STEPS.length - 1) {
      try {
        setIsSubmitting(true);
        // We will not save partial progress to avoid backend validation errors
        // since the backend requires all fields to be non-empty strings.
        // We will just move to the next step and save everything at the end.

        flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
        setCurrentIndex(currentIndex + 1);
      } catch (err) {
        setError(err.message || "Failed to save progress.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await submitProfile();
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    setError(null);
    if (currentIndex > 0) {
      flatListRef.current.scrollToIndex({ index: currentIndex - 1, animated: true });
      setCurrentIndex(currentIndex - 1);
    } else {
      // Should we allow going back to SignIn if they started onboarding? Usually no.
      // navigation.goBack();
    }
  };

  const submitProfile = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const localPhotos = formData.photos.filter(p => !p.startsWith('http'));
      const alreadyUploaded = formData.photos.filter(p => p.startsWith('http'));

      let uploadedUrls = [...alreadyUploaded];
      if (localPhotos.length > 0) {
        setUploadStatus('Uploading photos (this may take a moment)...');
        const newUrls = await uploadPhotos(localPhotos);
        uploadedUrls = [...uploadedUrls, ...newUrls];
      }

      setUploadStatus('Finalizing profile...');
      await updateProfileStep({
        ...formData,
        photos: uploadedUrls,
        bio: formData.bio.trim() || undefined,
      });

      // After this, AuthContext sets user.isProfileComplete = true
      // and RootNavigator handles the switch to main tabs automatically.
    } catch (err) {
      setError(err.message || "Failed to complete profile. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  const renderStep = ({ item }) => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>

        <View style={styles.cardContainer}>
          {item.id === 'gender' && <GenderStep formData={formData} updateForm={updateForm} />}
          {item.id === 'dob' && <DobStep formData={formData} updateForm={updateForm} />}
          {item.id === 'zodiac' && <ZodiacStep formData={formData} updateForm={updateForm} />}
          {item.id === 'occupation' && <OccupationStep formData={formData} updateForm={updateForm} />}
          {item.id === 'student' && <StudentStep formData={formData} updateForm={updateForm} />}
          {item.id === 'college_location' && <CollegeLocationStep formData={formData} updateForm={updateForm} />}
          {item.id === 'height_weight' && <HeightWeightStep formData={formData} updateForm={updateForm} />}
          {item.id === 'music_movies' && <MusicMoviesStep formData={formData} updateForm={updateForm} />}
          {item.id === 'date_food' && <DateFoodStep formData={formData} updateForm={updateForm} />}
          {item.id === 'looking_for' && <LookingForStep formData={formData} updateForm={updateForm} />}
          {item.id === 'photos_bio' && <PhotosBioStep formData={formData} updateForm={updateForm} error={error} setError={setError} />}
        </View>
      </View>
    );
  };

  return (
    <OnboardingBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* Header & Progress Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, currentIndex === 0 && { opacity: 0 }]}
              onPress={handleBack}
              disabled={currentIndex === 0 || isSubmitting}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
            <Text style={styles.stepCount}>{currentIndex + 1}/{STEPS.length}</Text>
          </View>

          {/* Error Message */}
          {error && <Text style={styles.globalError}>{error}</Text>}

          {/* Content */}
          <FlatList
            ref={flatListRef}
            data={STEPS}
            renderItem={renderStep}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialScrollIndex={initialIndex}
            getItemLayout={(data, index) => (
              { length: W, offset: W * index, index }
            )}
          />

          {/* Bottom Action Area */}
          <View style={styles.bottomArea}>
            {uploadStatus ? <Text style={styles.uploadStatusText}>{uploadStatus}</Text> : null}
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={isSubmitting ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)'] : [COLORS.maroon, COLORS.burgundy]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>
                  {isSubmitting ? 'Saving...' : currentIndex === STEPS.length - 1 ? 'Complete Profile' : 'Continue'}
                </Text>
                {!isSubmitting && <Ionicons name={currentIndex === STEPS.length - 1 ? "checkmark" : "arrow-forward"} size={20} color="#fff" style={{ marginLeft: 8 }} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: W * 0.06,
    paddingTop: W * 0.04,
    marginBottom: W * 0.04,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.pinkHighlight,
    borderRadius: 3,
  },
  stepCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  globalError: {
    color: '#FF4D67',
    textAlign: 'center',
    marginHorizontal: W * 0.06,
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  stepContainer: {
    width: W,
    paddingHorizontal: W * 0.06,
  },
  titleContainer: {
    marginBottom: W * 0.08,
    marginTop: W * 0.02,
  },
  title: {
    fontSize: W * 0.08,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: W * 0.04,
    color: 'rgba(255,255,255,0.6)',
  },
  cardContainer: {
    flex: 1,
  },
  bottomArea: {
    paddingHorizontal: W * 0.06,
    paddingBottom: W * 0.06,
    paddingTop: W * 0.04,
  },
  nextBtn: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.pinkHighlight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  uploadStatusText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  }
});
