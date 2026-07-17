<div align="center">
  <!-- [LOGO_PLACEHOLDER: Add App Logo Here] -->
  <h1>💖 Dating App - Frontend</h1>
  
  <p>
    <strong>A modern, responsive, and beautiful mobile dating application built with React Native and Expo.</strong>
  </p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</div>

<br />

## 📖 Project Overview

This repository contains the frontend mobile application for the Dating App. It provides users with an intuitive and engaging interface to create profiles, discover potential matches, swipe, and chat in real-time. Designed with a mobile-first approach, the application leverages the latest features of React Native and Expo to deliver a native-like experience on both iOS and Android.

---

## ✨ Features

* **Tinder-like Swiping:** Smooth, gesture-driven swipe cards for liking or passing on profiles.
* **Real-Time Chat:** Instant messaging with matches powered by Socket.io.
* **Push Notifications:** Stay updated with instant alerts for new matches and messages.
* **User Authentication:** Secure login/signup flows, including Google OAuth.
* **Profile Management:** Upload photos, edit bios, and customize preferences.
* **Premium Upgrades:** UI integration for purchasing premium features via Stripe.
* **Lottie Animations:** Engaging micro-interactions and success screens.

---

## 🛠️ Technologies Used

* **Core:** React Native, Expo (`~54.0.0`)
* **Navigation:** React Navigation v7 (Native Stack, Bottom Tabs)
* **Networking:** Fetch API / Axios, Socket.io-client
* **Animations:** React Native Reanimated, Lottie React Native
* **Storage:** AsyncStorage
* **Fonts:** Expo Google Fonts (Bricolage Grotesque)
* **Media:** Expo Image Picker, Expo Video

---

## 📂 Folder Structure Explanation

```text
dating-app/
├── assets/                 # Static assets (images, fonts, splash screens)
├── src/
│   ├── components/         # Reusable UI components (Buttons, Cards, Inputs)
│   ├── navigation/         # Navigators (AuthStack, AppStack, TabNavigator)
│   ├── screens/            # Application screens (Home, Chat, Profile, Login)
│   ├── services/           # API handlers and Socket.io context/providers
│   ├── utils/              # Helper functions, constants, theme definitions
│   └── context/            # React Contexts (AuthContext, ThemeContext)
├── App.js                  # Application entry point
├── app.json                # Expo configuration file
└── package.json            # Project dependencies and scripts
```

---

## ⚙️ Installation Steps

### Prerequisites
* Node.js (v18 or newer recommended)
* npm or yarn
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* Expo Go app installed on your physical device (or an iOS Simulator / Android Emulator)

### Setup
1. **Clone the repository:**
   ```bash
   git clone <frontend-repo-url>
   cd dating-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:5000/api
   EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
   EXPO_PUBLIC_STRIPE_KEY=pk_test_your_stripe_public_key
   ```
   *(See `.env.example` if available)*

---

## 🚀 Running Locally

To start the Expo development server, run:
```bash
npm start
```
* Press `a` to open in Android Emulator.
* Press `i` to open in iOS Simulator.
* Scan the QR code with your phone's camera (iOS) or Expo Go app (Android) to run on a physical device.

---

## 📜 Development Scripts

* `npm start`: Starts the Expo packager.
* `npm run android`: Compiles and runs the Android native app (`expo run:android`).
* `npm run ios`: Compiles and runs the iOS native app (`expo run:ios`).
* `npm run web`: Starts the app in web mode (if configured).

---

## 🏗️ Build Process

To build the app for production (App Store / Google Play), we use Expo Application Services (EAS):
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android/iOS
eas build --platform android
eas build --platform ios
```

---

## 🔌 API Integration & State Management

* **API Calls:** Handled in the `src/services/` directory. Bearer tokens (JWT) are retrieved from AsyncStorage and attached to the `Authorization` header of requests.
* **State Management:** Uses React Context (`AuthContext`) for global state like user authentication status, combined with standard React hooks (`useState`, `useReducer`) for local component state.
* **Real-time:** `socket.io-client` maintains a persistent connection for chat and match notifications.

---

## 🧭 Routing & Protected Routes

Routing is managed by `React Navigation`. The app uses conditional rendering to enforce protected routes:
* **Unauthenticated:** Shows `AuthStack` (Login, Register, Forgot Password).
* **Authenticated:** Shows `AppStack` (Main Tabs, Chat Screen, Edit Profile).

---

## 🎨 UI Components & Responsive Design

* **Components:** Modular and reusable (e.g., `<CustomButton />`, `<SwipeCard />`).
* **Responsiveness:** Styles utilize React Native's `Flexbox`, `Dimensions` API, and `SafeAreaView` to ensure the layout adapts elegantly to different screen sizes and notch designs.

---

## 🚨 Error Handling & Troubleshooting

* **Network Errors:** Gracefully handled with user-friendly Toast notifications or alert dialogs.
* **Common Issue:** `Socket disconnected`. 
  * *Fix:* Ensure the backend is running and `EXPO_PUBLIC_SOCKET_URL` matches your local IP address (e.g., `http://192.168.x.x:5000`) instead of `localhost` when testing on a physical device.

---

## 🤝 Contributing Guidelines

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.
