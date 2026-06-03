# AI Pulse Android Build Guide

Follow these steps to generate a signed Android build for the Google Play Store or manual testing.

## Prerequisites
Ensure your web assets are synchronized with the native Android project:
```bash
cd mobile-app
npx cap copy
npx cap sync
```

## Generate Signed App Bundle (.aab)
*Use this for uploading to Google Play Console.*

```bash
cd android
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file=/Users/bhavikmangla/Downloads/ks_aipulse.jks \
  -Pandroid.injected.signing.store.password=polo0909!Q \
  -Pandroid.injected.signing.key.alias=key0 \
  -Pandroid.injected.signing.key.password=polo0909!Q
```
**Output Path:** `app/build/outputs/bundle/release/app-release.aab`

---

## Generate Signed APK (.apk)
*Use this for manual installation or sharing.*

```bash
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=/Users/bhavikmangla/Downloads/ks_aipulse.jks \
  -Pandroid.injected.signing.store.password=polo0909!Q \
  -Pandroid.injected.signing.key.alias=key0 \
  -Pandroid.injected.signing.key.password=polo0909!Q
```
**Output Path:** `app/build/outputs/apk/release/app-release.apk`

---

## Troubleshooting
If you get an error about the **Android SDK location**, ensure your `ANDROID_HOME` environment variable is set:
```bash
export ANDROID_HOME=~/Library/Android/sdk
```
