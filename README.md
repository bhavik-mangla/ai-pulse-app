# 📱 AI Pulse Mobile App

**Empowering Indian Citizens with Government Intelligence on the go.**

AI Pulse is the mobile companion to the [AIPulse Backend](https://github.com/bhavik-mangla/aipulse-backend). Built using **Capacitor**, it provides a high-performance, native-like experience for accessing official Indian government notifications and general news, enriched with AI insights and multi-language support.

---

## 📥 Download Now

<a href="https://play.google.com/store/apps/details?id=com.daily.aipulse">
  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" height="80">
</a>
<a href="https://apps.apple.com/us/app/ai-pulse-daily-short-news/id6770227108">
  <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" height="54" style="margin-bottom: 13px;">
</a>

---

[![Capacitor](https://img.shields.io/badge/Capacitor-Ready-blue.svg)](https://capacitorjs.com/)
[![React](https://img.shields.io/badge/Frontend-Vanilla_JS/React-green.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

The AI Pulse app is designed to deliver deterministic intelligence directly to citizens' mobile devices. It leverages the robust backend of AIPulse to provide:
- **Daily Digests**: AI-summarized notifications in English and Hindi.
- **Push-like Speed**: Lightweight web-core with native performance.
- **Offline Access**: Essential notification metadata cached for quick viewing.

---

## 🛠️ Tech Stack

- **Framework**: [Capacitor](https://capacitorjs.com/) (Cross-platform Native Bridge)
- **Frontend**: Vanilla HTML/CSS/JS (Migrating to React/TypeScript)
- **Platforms**: Android & iOS
- **Backend API**: Connects to the [AIPulse Backend API](https://github.com/bhavik-mangla/aipulse-backend)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bhavik-mangla/ai-pulse-app.git
   cd ai-pulse-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Synchronize native platforms**:
   ```bash
   npx cap sync
   ```

---

## 📱 Running the App

### Android
```bash
npx cap open android
```
Then, click the **Run** button in Android Studio.

### iOS
```bash
npx cap open ios
```
Then, click the **Run** button in Xcode.

---

## 🤝 For Collaborators

We are looking to improve the app! If you're a friend joining the project, here's how you can help:
- **UI/UX Enhancements**: Polishing the notification feed and detail views.
- **State Management**: Implementing a robust state container (Redux/Zustand).
- **Native Features**: Adding deep-linking and improved push notification handling.

---

## 📝 License

Distributed under the MIT License.

*Built with ❤️ for a more informed India.*
