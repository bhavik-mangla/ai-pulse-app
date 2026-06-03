#!/bin/bash

# AI Pulse Android Build Script
# This script synchronizes web assets and generates a signed APK.

# Colors for output
GREEN='\033[0u;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting AI Pulse Android Build Process...${NC}"

# Check for password argument
if [ -z "$1" ]; then
    echo -n "Enter Keystore Password: "
    read -s PASSWORD
    echo
else
    PASSWORD=$1
fi

if [ -z "$PASSWORD" ]; then
    echo -e "${RED}Error: Password is required.${NC}"
    exit 1
fi

# Step 1: Sync Web Assets
echo -e "${GREEN}Step 1: Syncing web assets...${NC}"
npx cap copy
if [ $? -ne 0 ]; then echo -e "${RED}Capacitor copy failed.${NC}"; exit 1; fi

npx cap sync
if [ $? -ne 0 ]; then echo -e "${RED}Capacitor sync failed.${NC}"; exit 1; fi

# Step 2: Build Signed APK
echo -e "${GREEN}Step 2: Building signed APK...${NC}"
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=/Users/bhavikmangla/Downloads/ks_aipulse.jks \
  -Pandroid.injected.signing.store.password=$PASSWORD \
  -Pandroid.injected.signing.key.alias=key0 \
  -Pandroid.injected.signing.key.password=$PASSWORD

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Build Successful!${NC}"
    echo -e "APK Location: android/app/build/outputs/apk/release/app-release.apk"
else
    echo -e "${RED}Build Failed. Please check the password and console output.${NC}"
    exit 1
fi
