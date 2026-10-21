# 🎬 ShowGo — Frontend (User App)

> Mobile client for **ShowGo** built with **React Native** and **Expo SDK 54**. Allows users to discover movies, select seats, book tickets, make payments, and view booking history.

---

## ⚡ Quickstart — Local Setup

### 1. Prerequisites
- **Node.js** (v20 or later): [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Expo Go** app on your physical device:
  - [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)
  *(Or use an Android Emulator / iOS Simulator).*

---

### 2. Installation

```bash
# Navigate to the frontend directory
cd frontend

# Install all dependencies
npm install
```

---

### 3. Environment Configuration

Create or update the `.env` file in the `frontend/` root:

```env
# Point to your running backend API
# NOTE: Use your machine's local network IP (e.g. 192.168.x.x) or EC2 public IP. Do NOT use localhost on a physical device.
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

> **Find your local IP:**
> - **Windows (PowerShell/CMD):** `ipconfig` (look for IPv4 Address)
> - **macOS / Linux:** `ipconfig getifaddr en0` or `hostname -I`

---

### 4. Start Development Server

```bash
# Start Metro bundler
npx expo start

# Or start with a clean cache (recommended after changing .env or dependencies)
npx expo start -c
```

**Running the app:**
- **Physical Phone**: Open **Expo Go** (Android) or **Camera** (iOS) and scan the QR code printed in the terminal.
- **Android Emulator**: Press <kbd>a</kbd> in the terminal.
- **iOS Simulator**: Press <kbd>i</kbd> in the terminal.

---

## 🛠️ Common Commands

| Command | Action |
|---|---|
| `npx expo start` | Start Expo dev server |
| `npx expo start -c` | Start with cache cleared |
| `npx expo doctor` | Diagnose dependency & configuration issues |
| `npx expo install --fix` | Automatically resolve dependency version mismatches |

---

## 🚀 CI/CD Pipeline (GitHub Actions)

The repository includes a GitHub Actions workflow to automatically build and generate an installable Android APK via Expo Application Services (EAS).

### Workflow File
- **Path**: `.github/workflows/build-frontend.yml`

### How It Works
1. Checks out repository code.
2. Sets up Node.js 20 and installs dependencies (`npm ci`).
3. Authenticates with Expo using your `EXPO_TOKEN`.
4. Executes EAS preview build:
   ```bash
   eas build --platform android --profile preview --non-interactive
   ```
5. Builds a downloadable `.apk` file directly in Expo Cloud.

### Required GitHub Secret
To enable the pipeline, add your Expo token to GitHub:
1. Generate an Access Token at [expo.dev](https://expo.dev) → **Account Settings** → **Access Tokens**.
2. Go to your GitHub Repository → **Settings** → **Secrets and variables** → **Actions**.
3. Create a **New repository secret**:
   - **Name**: `EXPO_TOKEN`
   - **Value**: `<Your-Expo-Access-Token>`

*(Note: Enable or uncomment the `on: push` or `workflow_dispatch` trigger in `.github/workflows/build-frontend.yml` whenever you want builds to run automatically).*

---

## 📂 Project Structure

```
frontend/
├── app/                  # App routes & screens (Expo Router file-based)
│   ├── (tabs)/           # Main tab navigation (home, search, tickets, profile)
│   ├── movie/[id]/       # Movie details, cinema selection, seat selection, checkout
│   ├── ticket/[id].tsx   # Ticket view & confirmation
│   ├── auth.tsx          # Login & OTP authentication
│   ├── location.tsx      # City / location selector
│   └── notifications.tsx # User notification center
├── assets/               # Images, icons, and fonts
├── components/           # Reusable UI components
├── config/               # API endpoints and notification configuration
├── .env                  # Environment variables (Backend API URL)
├── app.json              # Expo application manifest & metadata
└── eas.json              # EAS build profiles (development, preview, production)
```
