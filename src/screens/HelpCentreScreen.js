import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform,
  ScrollView, TextInput, Modal, ActivityIndicator, Alert, LayoutAnimation,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import * as userService from '../services/userService';



const { width: W } = Dimensions.get('window');

// ─── FAQ Data ────────────────────────────────────────────────────────
const HELP_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket-outline',
    color: '#6C5CE7',
    items: [
      {
        q: 'Creating an account',
        a: 'Download the app, tap "Sign Up", and enter your name, email, and a secure password. You\'ll receive a verification code via email — enter it to activate your account and begin setting up your profile.',
      },
      {
        q: 'Completing your profile',
        a: 'After signing up you\'ll be guided through a step-by-step profile setup: add your best photos, write a bio, and fill in details like your zodiac sign, interests, and what you\'re looking for. A complete profile gets up to 10× more matches.',
      },
      {
        q: 'Profile verification',
        a: 'Verification helps build trust. Go to your Profile → Verification and follow the on-screen selfie instructions. A blue badge will appear on your profile once verified, letting others know you\'re the real deal.',
      },
      {
        q: 'Photo guidelines',
        a: 'Use clear, well-lit photos that show your face. Avoid heavy filters, group shots as your first photo, or images with text overlays. Nudity, violence, or copyrighted content will be removed. We recommend 4-6 varied photos for the best results.',
      },
      {
        q: 'Finding matches',
        a: 'Head to the Discover tab to browse profiles. Swipe right to Like or left to Pass. When someone you\'ve liked also likes you back, it\'s a match! You can then start chatting from the Matches tab.',
      },
    ],
  },
  {
    id: 'account-profile',
    title: 'Account & Profile',
    icon: 'person-circle-outline',
    color: '#00B894',
    items: [
      {
        q: 'Edit profile',
        a: 'Go to Profile → Edit Profile. You can update your photos, bio, occupation, interests, and all personal details at any time. Changes are saved automatically.',
      },
      {
        q: 'Change email or phone number',
        a: 'Navigate to Profile → Security. Tap "Change Email" or "Change Phone" and follow the verification steps. You\'ll need to verify the new contact method before it replaces the old one.',
      },
      {
        q: 'Change password',
        a: 'Go to Profile → Security → Change Password. Enter your current password followed by your new password. For security, choose a strong combination of letters, numbers, and special characters.',
      },
      {
        q: 'Update preferences',
        a: 'From Profile → Privacy Settings, you can update your discovery preferences including age range, distance, and gender preferences. These control who appears in your Discover feed.',
      },
      {
        q: 'Pause profile',
        a: 'If you need a break, go to Profile → Privacy Settings → "Pause Discovery". Your profile won\'t appear in other users\' feeds, but your existing matches and conversations will remain intact.',
      },
      {
        q: 'Hide profile',
        a: 'Hiding your profile makes you completely invisible to new users. Existing matches can still message you. Toggle this from Profile → Privacy Settings → "Hide Profile".',
      },
    ],
  },
  {
    id: 'matches-chat',
    title: 'Matches & Chat',
    icon: 'chatbubbles-outline',
    color: '#E84393',
    items: [
      {
        q: 'How matching works',
        a: 'You match with someone when both of you swipe right (Like) on each other. Once matched, you\'ll both be notified and can start chatting from the Matches tab.',
      },
      {
        q: 'Sending likes',
        a: 'Swipe right on a profile or tap the heart icon to send a Like. Free users have a daily swipe limit; Premium members enjoy unlimited swipes and can see who has already liked them.',
      },
      {
        q: 'Super Likes',
        a: 'A Super Like lets the other person know you\'re especially interested. It stands out with a blue highlight. Free users get 1 Super Like per week; Premium members get 5 per day.',
      },
      {
        q: 'Chat after matching',
        a: 'Once matched, tap the match from your Matches tab to open a conversation. You can send text messages, and share your interests. Be respectful and genuine — first impressions matter!',
      },
      {
        q: 'Messaging rules',
        a: 'Keep conversations respectful and genuine. Harassment, spam, solicitation, or sharing explicit content is strictly prohibited and may result in an immediate ban. Report any inappropriate behaviour.',
      },
      {
        q: 'Payment required before chatting',
        a: 'Some features may require a Premium subscription to unlock full messaging capabilities. Check the Premium section for subscription options and benefits.',
      },
      {
        q: 'Unmatching someone',
        a: 'Open the chat with the person you want to unmatch, tap the three-dot menu in the top right, and select "Unmatch". This will remove the match and delete the conversation for both of you.',
      },
    ],
  },
  {
    id: 'premium-payments',
    title: 'Premium & Payments',
    icon: 'diamond-outline',
    color: '#FDCB6E',
    items: [
      {
        q: 'Premium benefits',
        a: 'Premium members enjoy unlimited swipes, the ability to see who liked them, 5 daily Super Likes, profile boosts, an ad-free experience, advanced filters, and priority customer support.',
      },
      {
        q: 'Subscription plans',
        a: 'We offer flexible plans: 1-month, 3-month, 6-month, and annual subscriptions. Longer plans come with bigger savings. View current pricing in Profile → Premium Membership.',
      },
      {
        q: 'Payment methods',
        a: 'We accept payments through your device\'s app store (Apple App Store or Google Play). All transactions are processed securely through the platform\'s built-in payment system.',
      },
      {
        q: 'Billing FAQs',
        a: 'Your subscription renews automatically at the end of each billing cycle. You can view your next billing date and payment history in your device\'s app store subscription settings.',
      },
      {
        q: 'Refund policy',
        a: 'Refunds are handled by Apple or Google depending on your device. To request a refund, contact Apple Support or Google Play Support directly. Refunds are typically processed within 5-7 business days.',
      },
      {
        q: 'Manage subscription',
        a: 'To manage your subscription, go to your device\'s Settings → Subscriptions (iOS) or Google Play → Subscriptions (Android). From there you can upgrade, downgrade, or modify your plan.',
      },
      {
        q: 'Cancel subscription',
        a: 'To cancel, go to your device\'s subscription settings. Your Premium benefits will remain active until the end of the current billing period. You will not be charged again after cancellation.',
      },
    ],
  },
  {
    id: 'safety-privacy',
    title: 'Safety & Privacy',
    icon: 'shield-checkmark-outline',
    color: '#00CEC9',
    items: [
      {
        q: 'Community Guidelines',
        a: 'We\'re committed to creating a safe, inclusive space. Harassment, hate speech, fake profiles, spam, and inappropriate content are not tolerated. Violations result in warnings, suspensions, or permanent bans.',
      },
      {
        q: 'Safety Tips',
        a: 'Always meet in public places for first dates. Tell a friend where you\'re going. Trust your instincts — if something feels off, leave. Never share financial information or send money to someone you\'ve met online.',
      },
      {
        q: 'Report a user',
        a: 'Tap the three-dot menu on any profile or inside a chat, then select "Report". Choose the reason and add any details. Reports are reviewed within 24 hours by our Trust & Safety team.',
      },
      {
        q: 'Block a user',
        a: 'Tap the three-dot menu on their profile or in your chat and select "Block". They won\'t be able to see your profile, message you, or find you in discovery. You can manage blocked users in Privacy Settings.',
      },
      {
        q: 'Fake profile reporting',
        a: 'If you suspect a profile is fake or uses someone else\'s photos, report it immediately using the Report feature. Our team uses advanced verification tools to investigate and take action quickly.',
      },
      {
        q: 'Privacy Policy',
        a: 'We take your privacy seriously. Your personal data is encrypted, never sold to third parties, and only used to improve your experience. Read our full Privacy Policy in the Legal section below.',
      },
      {
        q: 'Data protection',
        a: 'All data is encrypted in transit (TLS) and at rest (AES-256). We follow GDPR and CCPA guidelines. You can request a copy of your data or request deletion at any time from Privacy Settings.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications-outline',
    color: '#A29BFE',
    items: [
      {
        q: 'Push notifications',
        a: 'Enable push notifications in your device settings to receive real-time alerts for new matches, messages, and likes. You can customise which notifications you receive in Profile → Notification Preferences.',
      },
      {
        q: 'Email notifications',
        a: 'We send periodic email updates about new matches, promotional offers, and account security alerts. You can manage your email preferences from Profile → Notification Preferences or unsubscribe via the link in any email.',
      },
      {
        q: 'Match alerts',
        a: 'When someone you\'ve liked also likes you back, you\'ll receive an instant notification. Make sure notifications are enabled so you never miss a connection!',
      },
      {
        q: 'Message alerts',
        a: 'Get notified when you receive a new message from a match. If you\'re in a conversation, you\'ll see the message in real-time. You can mute specific conversations from the chat menu.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: 'build-outline',
    color: '#FF7675',
    items: [
      {
        q: 'Login issues',
        a: 'Double-check your email and password. If you\'ve forgotten your password, tap "Forgot Password" on the login screen to reset it via email. If issues persist, try clearing the app cache or reinstalling.',
      },
      {
        q: 'OTP not received',
        a: 'Check your spam/junk folder. Ensure your email address is correct. Wait at least 60 seconds before requesting a new code. If you\'re still not receiving it, try using a different email address or contact support.',
      },
      {
        q: 'Email verification issues',
        a: 'If the verification link has expired, request a new one from the login screen. Make sure you\'re clicking the link on the same device where the app is installed. Check that your email provider isn\'t blocking our messages.',
      },
      {
        q: 'App crashes',
        a: 'Make sure you\'re running the latest version of the app. Try force-closing and reopening it. If crashes continue, clear the app cache (Settings → Apps → Clear Cache) or reinstall. Please report persistent crashes to our support team.',
      },
      {
        q: 'Messages not sending',
        a: 'Check your internet connection. Make sure the conversation hasn\'t been unmatched. Try closing and reopening the chat. If the problem persists, force-close the app and reopen it.',
      },
      {
        q: 'Payment failed',
        a: 'Ensure your payment method is up to date in your device\'s app store settings. Check that you have sufficient funds. Try a different payment method. If the issue continues, contact Apple or Google support.',
      },
      {
        q: 'Connectivity problems',
        a: 'Switch between Wi-Fi and mobile data to test your connection. Restart your device. Make sure the app has permission to use cellular data (check device Settings → Apps). If issues persist, try reinstalling the app.',
      },
    ],
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    icon: 'mail-outline',
    color: '#74B9FF',
    items: [
      {
        q: 'Contact Us',
        a: 'We\'re here to help! Reach out through the in-app support form or email us directly at shwtyyyworks@gmail.com. Our team is available 7 days a week to assist you.',
      },
      {
        q: 'Email Support',
        a: 'For detailed inquiries, email us at shwtyyyworks@gmail.com. Please include your registered email address, a description of the issue, and any relevant screenshots. This helps us resolve your issue faster.',
      },
      {
        q: 'FAQ',
        a: 'You\'re already here! Browse the sections above for answers to the most common questions. Our FAQ covers account setup, matching, payments, safety, and troubleshooting.',
      },
      {
        q: 'Response time information',
        a: 'We aim to respond to all support requests within 24-48 hours. Premium members receive priority support with response times under 12 hours. Complex issues may take additional time to investigate.',
      },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    icon: 'document-text-outline',
    color: '#636E72',
    items: [
      {
        q: 'Terms & Conditions',
        a: 'By using our app, you agree to our Terms & Conditions which govern your use of the service, user responsibilities, intellectual property rights, and dispute resolution. The full document is available on our website.',
      },
      {
        q: 'Privacy Policy',
        a: 'Our Privacy Policy explains what data we collect, how we use it, your rights regarding your data, and how we protect your information. We comply with GDPR, CCPA, and other applicable data protection laws.',
      },
      {
        q: 'Cookie Policy',
        a: 'We use cookies and similar technologies to improve your experience, remember your preferences, and analyse app usage. You can manage cookie preferences in your device and browser settings.',
      },
      {
        q: 'Community Guidelines',
        a: 'Our Community Guidelines set the standard for behaviour on the platform. They cover respect, authenticity, safety, and prohibited content. Violations are taken seriously and may result in account suspension.',
      },
      {
        q: 'Open Source Licenses',
        a: 'This app uses several open-source libraries and frameworks. We gratefully acknowledge the open-source community. A full list of licenses is available in the app\'s settings under "Open Source Licenses".',
      },
      {
        q: 'App Version',
        a: 'You are currently using version 1.0.0. We regularly release updates with new features, bug fixes, and performance improvements. Make sure auto-updates are enabled to always have the latest version.',
      },
    ],
  },
];

// ─── Sub-components ──────────────────────────────────────────────────

const FAQAccordionItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  return (
    <View style={s.faqItem}>
      <TouchableOpacity activeOpacity={0.7} style={s.faqRow} onPress={toggle}>
        <Text style={s.faqQ}>{item.q}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="rgba(255,255,255,0.5)"
        />
      </TouchableOpacity>
      {expanded && <Text style={s.faqA}>{item.a}</Text>}
    </View>
  );
};

const SectionCard = ({ section, isExpanded, onToggle, index }) => {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 60)} style={s.sectionWrap}>
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle}>
        <View style={s.sectionCard}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[s.sectionIconWrap, { backgroundColor: `${section.color}22` }]}>
            <Ionicons name={section.icon} size={24} color={section.color} />
          </View>
          <View style={s.sectionTextWrap}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionSubtitle}>{section.items.length} articles</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-forward'}
            size={20}
            color="rgba(255,255,255,0.4)"
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={s.sectionBody}>
          {section.items.map((item, i) => (
            <FAQAccordionItem key={i} item={item} />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────

export default function HelpCentreScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Search filtering ──
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HELP_SECTIONS;

    return HELP_SECTIONS.map(section => {
      const matchedItems = section.items.filter(
        item =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
      );
      if (matchedItems.length === 0) return null;
      return { ...section, items: matchedItems };
    }).filter(Boolean);
  }, [searchQuery]);

  // ── Section toggle ──
  const toggleSection = useCallback((sectionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSectionId(prev => (prev === sectionId ? null : sectionId));
  }, []);

  // ── Delete account ──
  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      setShowDeleteModal(false);
      signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete your account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmText, signOut]);

  // ── Log out ──
  const handleLogOut = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  }, [signOut]);

  const isDeleteEnabled = deleteConfirmText.trim().toUpperCase() === 'DELETE';

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a0a0e', COLORS.burgundy, '#0d0507']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Header ── */}
      <View style={s.header}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help Centre</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <Animated.View entering={FadeInDown.duration(500)} style={s.heroWrap}>
          <View style={s.heroIconWrap}>
            <LinearGradient colors={[COLORS.pinkHighlight, COLORS.maroon]} style={s.heroIconGradient}>
              <Ionicons name="help-buoy-outline" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={s.heroTitle}>How can we help you?</Text>
          <Text style={s.heroSubtitle}>Search our help articles or browse by category below.</Text>
        </Animated.View>

        {/* ── Search Bar ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(80)} style={s.searchWrap}>
          <View style={s.searchBar}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.5)" style={s.searchIcon} />
            <TextInput
              style={s.searchInput}
              placeholder="Search articles..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={s.searchClear}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Search result count ── */}
        {searchQuery.trim().length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={s.searchResultWrap}>
            <Text style={s.searchResultText}>
              {filteredSections.reduce((sum, sec) => sum + sec.items.length, 0)} results found
            </Text>
          </Animated.View>
        )}

        {/* ── Category Sections ── */}
        <View style={s.sectionsContainer}>
          {filteredSections.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={s.emptyState}>
              <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={s.emptyTitle}>No results found</Text>
              <Text style={s.emptySubtitle}>Try different keywords or browse the categories.</Text>
            </Animated.View>
          ) : (
            filteredSections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                isExpanded={expandedSectionId === section.id || searchQuery.trim().length > 0}
                onToggle={() => toggleSection(section.id)}
              />
            ))
          )}
        </View>

        {/* ── Danger Zone ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(600)} style={s.dangerZone}>
          <View style={s.dangerDivider} />
          <Text style={s.dangerLabel}>Danger Zone</Text>

          <TouchableOpacity activeOpacity={0.8} onPress={handleLogOut}>
            <View style={s.dangerBtn}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <Ionicons name="log-out-outline" size={22} color="#FF8C5A" style={{ marginRight: 12 }} />
              <Text style={s.dangerBtnTextOrange}>Log Out</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,140,90,0.5)" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDeleteModal(true)}>
            <View style={s.dangerBtnRed}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <Ionicons name="trash-outline" size={22} color="#FF4D67" style={{ marginRight: 12 }} />
              <Text style={s.dangerBtnTextRed}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,77,103,0.5)" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>Version 1.0.0</Text>
          <Text style={s.footerText}>Made with ❤️</Text>
        </View>
      </ScrollView>

      {/* ═══ Delete Account Confirmation Modal ═══ */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={s.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

          <Animated.View entering={FadeInDown.duration(400)} style={s.modalCard}>
            <LinearGradient
              colors={['#2a0f14', '#1a0a0e']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Warning Icon */}
            <View style={s.modalIconWrap}>
              <LinearGradient colors={['#FF4D67', '#CC1A33']} style={s.modalIconGradient}>
                <Ionicons name="warning" size={32} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={s.modalTitle}>Delete Your Account?</Text>

            <Text style={s.modalDesc}>
              This action is{' '}
              <Text style={{ fontWeight: '800', color: '#FF4D67' }}>permanent</Text> and cannot be undone.
              The following will be permanently removed:
            </Text>

            <View style={s.modalList}>
              {[
                'Your profile and all personal information',
                'All matches and chat history',
                'Your photos and media',
                'Subscription and payment data',
                'Account preferences and settings',
              ].map((text, i) => (
                <View key={i} style={s.modalListItem}>
                  <Ionicons name="close-circle" size={16} color="#FF4D67" style={{ marginRight: 10, marginTop: 2 }} />
                  <Text style={s.modalListText}>{text}</Text>
                </View>
              ))}
            </View>

            <View style={s.modalConfirmWrap}>
              <Text style={s.modalConfirmLabel}>
                Type <Text style={{ fontWeight: '800', color: '#FF4D67' }}>DELETE</Text> to confirm
              </Text>
              <View style={s.modalInputWrap}>
                <TextInput
                  style={s.modalInput}
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="Type DELETE"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isDeleting}
                />
              </View>
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setDeleteConfirmText('');
                  setShowDeleteModal(false);
                }}
                style={s.modalCancelBtn}
                disabled={isDeleting}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDeleteAccount}
                disabled={!isDeleteEnabled || isDeleting}
                style={[
                  s.modalDeleteBtn,
                  (!isDeleteEnabled || isDeleting) && s.modalDeleteBtnDisabled,
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={s.modalDeleteText}>Delete Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0507' },

  // Header
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingBottom: 60,
  },

  // Hero
  heroWrap: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
    paddingHorizontal: W * 0.08,
  },
  heroIconWrap: {
    marginBottom: 16,
  },
  heroIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Search
  searchWrap: {
    paddingHorizontal: W * 0.05,
    paddingTop: 20,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    height: 52,
  },
  searchIcon: { marginLeft: 16 },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  searchClear: { paddingRight: 14, paddingLeft: 4 },

  searchResultWrap: {
    paddingHorizontal: W * 0.06,
    paddingBottom: 4,
  },
  searchResultText: {
    color: COLORS.pinkHighlight,
    fontSize: 13,
    fontWeight: '600',
  },

  // Sections
  sectionsContainer: {
    paddingHorizontal: W * 0.05,
    paddingTop: 16,
  },
  sectionWrap: {
    marginBottom: 12,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sectionTextWrap: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },

  // Section expanded body
  sectionBody: {
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
    paddingVertical: 4,
  },

  // FAQ items
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  faqQ: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginRight: 10,
  },
  faqA: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },

  // Danger Zone
  dangerZone: {
    paddingHorizontal: W * 0.05,
    paddingTop: 24,
    marginTop: 16,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,77,103,0.15)',
    marginBottom: 20,
  },
  dangerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4D67',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
    marginLeft: 4,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,140,90,0.15)',
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  dangerBtnRed: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.2)',
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  dangerBtnTextOrange: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C5A',
  },
  dangerBtnTextRed: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4D67',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.2)',
    fontWeight: '500',
  },

  // ═══ Delete Modal ═══
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.15)',
    overflow: 'hidden',
    padding: 28,
  },
  modalIconWrap: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalList: {
    marginBottom: 24,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalListText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },
  modalConfirmWrap: {
    marginBottom: 24,
  },
  modalConfirmLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalInputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  modalInput: {
    height: 50,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  modalDeleteBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FF4D67',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteBtnDisabled: {
    backgroundColor: 'rgba(255,77,103,0.25)',
  },
  modalDeleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
