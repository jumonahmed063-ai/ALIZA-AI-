# ALIZA AI – Smart Voice Assistant 🤖✨

> **Your Smart Voice, Your Personal Assistant.**  
> Developed with vision by **MR. JUMON**.

---

## 🌟 Overview

**ALIZA AI** is a smart, voice-controlled personal AI assistant application built with React 19, TypeScript, Tailwind CSS, Express, and Capacitor for Android. It combines natural conversational AI powered by Google Gemini, real mobile voice commands, YouTube & WhatsApp integrations, and quick phone utilities inside an eye-catching neon pink/cyan/purple interface.

### Key Capabilities
- **Natural Voice & Conversation**: Real-time voice interaction with 5 Gemini neural voice personas (Kore, Zephyr, Puck, Fenrir, Charon) and seamless browser speech synthesis fallback.
- **YouTube Voice Control**: Live search and video playback via real YouTube links and Capacitor Browser, plus an in-app curated video player.
- **WhatsApp Integration**: Voice-guided contact messaging and call prep with explicit user confirmation before opening WhatsApp (`wa.me`).
- **Quick Phone Tools**: Honest mobile utilities including system dialer launcher (`tel:`), live camera preview with user permissions, stopwatch/timer, calculator, quick notes, and in-app preferences.
- **Offline Resilience**: Automatic health-checking with clear `"Aliza is offline – basic commands only"` banner and local heuristic assistant engine.
- **Safe & Family-Friendly**: Strict safety instructions filtering violent, hateful, sexual, and self-harm content with polite guidance.

---

## 🛠️ Architecture

```
ALIZA AI Project Structure
├── server.ts                 # Express backend proxy (Gemini API, TTS, /api/health)
├── capacitor.config.ts       # Capacitor native app configuration (com.aliza.ai)
├── android/                  # Native Android project with Gradle wrapper
│   └── app/src/main/
│       ├── AndroidManifest.xml # Permissions (INTERNET, RECORD_AUDIO, CAMERA)
│       └── res/mipmap-*        # App launcher icons
├── src/
│   ├── App.tsx               # Main assistant interface & state machine
│   ├── config.ts             # Exports API_BASE (VITE_API_BASE_URL)
│   ├── hooks/useSpeech.ts    # Capacitor Speech Recognition + Webkit Speech fallback
│   ├── components/           # UI hubs (YouTube, WhatsApp, Quick Tools, Settings, etc.)
│   └── services/soundFx.ts   # Web Audio synthesized sound effects
└── .github/workflows/
    └── android-debug.yml     # Automated GitHub Actions APK build workflow
```

> **Security Guarantee**: The `GEMINI_API_KEY` is strictly confined to `server.ts` on the backend and is **never** bundled into the client code or Android APK.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v20+)
- npm (v10+)
- Android Studio Ladybug or newer (for local native Android builds)
- Java JDK 17

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and supply your Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
VITE_API_BASE_URL=""
GEMINI_CHAT_MODEL="gemini-2.5-flash"
GEMINI_FALLBACK_MODEL="gemini-1.5-flash"
GEMINI_TTS_MODEL="gemini-3.8-flash-lite-tts"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying the Backend Server

To use ALIZA AI as a standalone Android APK on a physical phone:
1. Deploy `server.ts` to any Node.js hosting platform (e.g. **Google Cloud Run**, **Render**, **Railway**, or a VPS).
2. Set `GEMINI_API_KEY` in your hosting provider's environment secrets.
3. Obtain your deployed public URL (e.g., `https://aliza-backend.onrender.com`).
4. Set this URL as `VITE_API_BASE_URL` when compiling the APK so the mobile app communicates with your server.

---

## 📱 Building the Android Debug APK

### Method A: Automated GitHub Actions CI (Recommended)

1. Push this repository to GitHub.
2. In your repository on GitHub:
   - Navigate to **Settings > Secrets and variables > Actions**.
   - Add a repository secret named `VITE_API_BASE_URL` with your public backend URL.
3. Go to the **Actions** tab, select **Build Android Debug APK**, and click **Run workflow**.
4. Once completed, scroll down to the **Artifacts** section and download `ALIZA-AI-debug-apk.zip`.
5. Extract `app-debug.apk` and transfer it to your Android device.

---

### Method B: Local Build via Terminal & Gradle

1. Build the frontend web bundle:
```bash
VITE_API_BASE_URL="https://your-server-url.com" npm run build
```

2. Sync the assets to the Android native directory:
```bash
npm run cap:sync
```

3. Assemble the debug APK using Gradle:
```bash
npm run apk:debug
```
Or directly:
```bash
cd android
./gradlew assembleDebug
```

4. Locate your debug APK at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Method C: Android Studio

1. Open Android Studio.
2. Select **Open an Existing Project** and choose the `/android` folder inside this project.
3. Wait for Gradle sync to complete.
4. Connect an Android phone via USB (with Developer Options & USB Debugging enabled) or start an emulator.
5. Click **Run > Run 'app'** (Green play button) or **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 📲 Installing on Your Android Phone

1. Transfer `app-debug.apk` to your phone via USB cable, Google Drive, or email.
2. On your Android phone, tap the APK file in your **Files** / **Downloads** app.
3. If prompted with *"Install unknown apps"*:
   - Tap **Settings**.
   - Enable **Allow from this source** for your browser or file manager.
   - Return and tap **Install**.
4. Launch **ALIZA AI** from your app drawer.
5. When prompted, grant **Microphone** and **Camera** permissions for hands-free voice control.

---

## 🛡️ Content Safety & Policy Adherence

ALIZA AI incorporates multi-layered safety guardrails:
- **System-Level Filter**: Strict prompts refuse violent, illegal, harmful, hate speech, or sexually explicit requests, offering calm, friendly guidance.
- **Transparent Actions**: No fake "messages sent" or stealth dials. ALIZA AI explicitly asks for user confirmation and hands off directly to official apps (`wa.me` for WhatsApp and the system dialer `tel:`).

---

## 👑 Credits & Attribution

- **Creator & Lead Visionary**: **MR. JUMON**
- **App Name**: ALIZA AI – Smart Voice Assistant
- **Design Philosophy**: High-octane cyberpunk neon aesthetics with approachable companion warmth.
