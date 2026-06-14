# PetroLog

PetroLog is a React Native / Expo app for tracking petrol purchases, monthly fuel expenses, and payment status. It is built for Android and stores data locally with SQLite.

## Features

- Add, edit, search, and delete petrol purchase records
- Track liters, price per liter, total cost, date, time, and notes
- View current month totals and outstanding balance
- Mark monthly petrol balance as paid
- Enable monthly payment reminders
- View weekly and monthly reports with charts
- Export/share records from the app
- Local offline storage using Expo SQLite

## Tech Stack

- Expo SDK 56
- React Native 0.85
- Expo Router
- Expo SQLite
- Expo Notifications
- React Native Gifted Charts
- TypeScript

## Requirements

- Node.js
- npm
- Expo CLI / EAS CLI through `npx`
- Android device or emulator
- Expo account for cloud APK builds

## Install

```bash
npm install
```

## Run Locally

Start the Expo development server:

```bash
npm start
```

Run on Android:

```bash
npm run android
```

## Build Android APK

The `preview` EAS profile is configured to generate a direct-install APK.

```bash
npx eas build -p android --profile preview
```

After the build finishes, EAS provides an `.apk` download link that can be opened on an Android phone.

## Current APK

A direct-install APK was generated with EAS Build:

```text
https://expo.dev/artifacts/eas/TF5xw4ZDB7id9RosQV4VquELS0Ec2U8BTrwSPlkRqzM.apk
```

APK files are ignored in Git because they are large build artifacts. Upload APKs to GitHub Releases instead of committing them directly.

## Android Package

```text
com.petrolog.app
```

## Project Structure

```text
app/              Expo Router screens and tabs
assets/           App icons and images
src/db/           SQLite database helpers
src/theme/        App colors and theme constants
src/utils/        Formatting and date helpers
app.json          Expo app configuration
eas.json          EAS build profiles
```

## Notes

- The app is configured for portrait orientation.
- The `preview` build profile creates an APK for direct installation.
- The `production` build profile creates an Android App Bundle for Play Store upload.
