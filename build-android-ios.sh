#!/bin/bash

# AI Pulse Mobile Release Script (Android & iOS)
# This script synchronizes web assets and generates all production Android artifacts (.aab and .apk).

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting AI Pulse Release Process...${NC}"

# Check for password argument
if [ -z "$1" ]; then
    echo -n "Enter Keystore Password (polo0909!Q): "
    read -s PASSWORD
    echo
else
    PASSWORD=$1
fi

if [ -z "$PASSWORD" ]; then
    echo -e "${RED}Error: Password is required.${NC}"
    exit 1
fi

# Step 1: Sync Web Assets for BOTH Platforms
echo -e "${GREEN}Step 1: Syncing web assets for Android and iOS...${NC}"
npx cap copy
if [ $? -ne 0 ]; then echo -e "${RED}Capacitor copy failed.${NC}"; exit 1; fi

npx cap sync
if [ $? -ne 0 ]; then echo -e "${RED}Capacitor sync failed.${NC}"; exit 1; fi

# Step 2: Build Android Artifacts
echo -e "${GREEN}Step 2: Building signed Android App Bundle (.aab) and APK (.apk)...${NC}"
cd android

# Build App Bundle (.aab) for Play Store
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file=/Users/bhavikmangla/Downloads/ks_aipulse.jks \
  -Pandroid.injected.signing.store.password=$PASSWORD \
  -Pandroid.injected.signing.key.alias=key0 \
  -Pandroid.injected.signing.key.password=$PASSWORD

if [ $? -ne 0 ]; then echo -e "${RED}Bundle build failed. Check password.${NC}"; exit 1; fi

# Build APK (.apk) for manual testing
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=/Users/bhavikmangla/Downloads/ks_aipulse.jks \
  -Pandroid.injected.signing.store.password=$PASSWORD \
  -Pandroid.injected.signing.key.alias=key0 \
  -Pandroid.injected.signing.key.password=$PASSWORD

if [ $? -ne 0 ]; then echo -e "${RED}APK build failed. Check password.${NC}"; exit 1; fi

# Final Report
echo -e "\n${BLUE}--- Android Build Successful ---${NC}"
echo -e "${GREEN}Play Store (.aab):${NC} android/app/build/outputs/bundle/release/app-release.aab"
echo -e "${GREEN}Manual APK (.apk):${NC} android/app/build/outputs/apk/release/app-release.apk"
echo -e "${GREEN}Deobfuscation File (mapping.txt):${NC} android/app/build/outputs/mapping/release/mapping.txt"

echo -e "\n${BLUE}--- iOS Status ---${NC}"
echo -e "Web assets are synchronized. Final native build must be completed in Xcode."
echo -e "${BLUE}Command:${NC} npx cap open ios"
echo -e "${BLUE}Xcode Menu:${NC} Product > Archive"
