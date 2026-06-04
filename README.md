# 📱 AI Pulse Mobile App

**Stay Informed with General News and Official Government Intelligence on the go.**

AI Pulse is the mobile companion to the [AIPulse Backend](https://github.com/bhavik-mangla/aipulse-backend). Built using **Capacitor**, it provides a high-performance, native-like experience for accessing general news and official government notifications, enriched with AI insights and multi-language support.

---

## 📥 Download & Test

### **iOS (Public Beta)**
<a href="https://apps.apple.com/us/app/ai-pulse-daily-short-news/id6770227108">
  <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" height="54">
</a>

### **Android (Closed Testing)**
To test the Android version, please follow these steps:
1. **Join the Testers Group**: [Join Google Group](https://groups.google.com/g/ai-pulse-testers) (Required for access).
2. **Opt-in to Testing**: [Enable Testing on Play Store](https://play.google.com/apps/testing/com.daily.aipulse).
3. **Download**: [Get it on Google Play](https://play.google.com/store/apps/details?id=com.daily.aipulse).

---

[![Capacitor](https://img.shields.io/badge/Capacitor-Ready-blue.svg)](https://capacitorjs.com/)
[![React](https://img.shields.io/badge/Frontend-Vanilla_JS/React-green.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

The AI Pulse app is designed to deliver curated news and deterministic intelligence directly to your mobile device. It leverages the robust backend of AIPulse to provide:
- **Reels-Style Feed**: A fluid, full-screen vertical scrolling experience optimized for quick consumption.
- **Smart Visuals**: Automated image fallback using Wikipedia API and unified branding for government portals.
- **Clean UI**: AI-summarized notifications in English and Hindi with impact-based triage.
- **Zero-Cost Architecture**: Built to run completely free using GitHub Actions for ingestion and Vercel for the API.

---

## 🛠️ Tech Stack

- **Framework**: [Capacitor](https://capacitorjs.com/) (Cross-platform Native Bridge)
- **Frontend**: Vanilla HTML/CSS/JS (Optimized for performance and low latency)
- **Platforms**: Android & iOS
- **Automation**: GitHub Actions (for serverless data ingestion)
- **Backend API**: Connects to the [AIPulse Backend API](https://github.com/bhavik-mangla/aipulse-backend) (Hosted on Vercel)

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

*Built with ❤️ for a more informed society.*
