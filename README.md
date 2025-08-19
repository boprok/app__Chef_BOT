# 🍳 Chef Bot – AI-Powered Fridge-to-Recipe App

*Turn your ingredients into dinner, fast.* 

A React Native mobile app with FastAPI backend that analyzes fridge photos and generates personalized recipes using AI.

## 🚀 Quick Start

### 📱 Mobile App (React Native + Expo)
```bash
cd mobile/ChefBot
npx expo start --tunnel
# Scan QR code with Expo Go (Android) or Camera (iOS)
```

### �️ Server (FastAPI + Supabase)
The backend is deployed on Render:
- **Live API**: https://app-chef-bot-api.onrender.com
- **Documentation**: https://app-chef-bot-api.onrender.com/docs

## 🏗️ Architecture

### 📱 **Mobile App**
- **Framework**: React Native with Expo (Tunnel mode)
- **Components**: Modular structure (Header, Modals, SplashScreen)
- **Authentication**: JWT with AsyncStorage persistence
- **Camera**: Photo capture and gallery integration
- **State**: React hooks for modal and auth management

### 🖥️ **Backend**
- **Framework**: FastAPI with async/await
- **Database**: Supabase PostgreSQL (via REST API)
- **AI**: Google Gemini for recipe analysis
- **Authentication**: JWT tokens with user accounts
- **Hosting**: Render cloud platform

### 🎨 **Design System**
- **Primary**: `#2ba84a` (Chef Bot green)
- **Accent**: `#ffc53a` (golden yellow)
- **Secondary**: `#e06d06` (orange)
- **Background**: `#000000` (black)
- **Surface**: `#f7f9f8` (off-white)

## ✨ Features

### 🔐 **Authentication**
- User signup/login with email/password
- JWT token persistence with AsyncStorage
- First-time user automatic signup flow
- Dashboard with user stats and logout

### 📸 **Recipe Analysis**
- Camera integration for fridge photos
- AI-powered ingredient identification
- Personalized recipe suggestions
- Cooking time estimates and instructions

### 🎨 **Modern UI**
- Dark theme with blur overlays
- Modular component architecture
- SVG logo and icons with optimal sizing
- Professional header layout (Dashboard ← → Go Pro → Logo)

### 💎 **PRO Features**
- Upgrade modal with pricing
- Enhanced recipe analysis
- Priority processing

## � Project Structure

```
chef_bot/
├── mobile/ChefBot/          # React Native Expo app
│   ├── App.js              # Main app (227 lines, modular)
│   ├── components/         # Reusable components
│   │   ├── Header.js       # App header with navigation
│   │   ├── MainContent.js  # Home screen content
│   │   ├── SplashScreen.js # Loading screen
│   │   └── modals/         # Modal components
│   ├── styles/             # Centralized styling
│   ├── assets/             # SVG icons and images
│   └── services/           # API and auth services
├── server/                 # FastAPI backend (deployed)
└── docs/                   # Project documentation
```

## 🔗 API Endpoints

- **Authentication**: 
  - `POST /api/auth/signup` - Create account
  - `POST /api/auth/login` - User login
  - `GET /api/auth/me` - Get user profile
- **Recipe Analysis**: 
  - `POST /api/analyze` - Analyze fridge photo
- **Health**: 
  - `GET /` - API status and info

## 🚀 Development

### Local Server (Optional)
```bash
cd server
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Mobile Development
```bash
cd mobile/ChefBot
npm install
npx expo start --tunnel
```

## 🌟 Recent Updates

- ✅ Modular app architecture (6 separate component files)
- ✅ Optimized header layout with logo positioning
- ✅ Fixed icon sizing and contrast issues
- ✅ Supabase database integration
- ✅ Render cloud deployment
- ✅ Authentication flow improvements

---

*Chef Bot - Your AI cooking assistant* 🤖👨‍🍳

### 🚀 Planned Features
- 💳 Premium subscriptions (unlimited analyses)
- 📋 Recipe favorites and history
- 🔍 Recipe search and filtering
- 📤 Recipe sharing
- 🛒 Shopping list generation
- 🌟 Recipe ratings and reviews

## Why Expo?

Expo is perfect for Chef Bot because:
- **Camera APIs**: Built-in photo capture and gallery access
- **Fast Development**: No native build setup required
- **Cross-platform**: Single codebase for iOS + Android
- **Easy Deployment**: Simple app store publishing
- **Great for MVPs**: Quick iteration and testing
- **Future-proof**: Can eject to pure React Native if needed

## Development

### Server Development
```bash
cd server
source venv/bin/activate
uvicorn app:app --reload  # Auto-reload on changes
```

### Mobile Development  
```bash
cd mobile/ChefBot
expo start  # Opens Expo Dev Tools
```

### API Testing
- Interactive docs: `http://localhost:8000/docs`
- Test script: `python server/test_api.py`
- Health check: `curl http://localhost:8000/api/health`

## Configuration

### Server Environment Variables
```bash
GEMINI_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret
FREE_MAX_MONTHLY=10
FREE_DELAY_SECONDS=1.5
```

### Mobile API Configuration
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'      // iOS Simulator
  : 'http://192.168.1.100:8000'; // Your computer's IP
```

Ready to build your mobile Chef Bot app! 🚀👨‍🍳a fridge photo into quick recipe ideas using AI. Mobile-first experience with React Native + Expo.

## What you get
- 📸 Take a photo of your fridge with your phone
- 🤖 AI identifies ingredients and suggests recipes (Gemini AI)
- 🔐 User accounts with authentication and usage tracking
- 📱 Native mobile experience with camera integration
- ⚡ Fast, lightweight FastAPI backend

## Project layout
- `mobile/` – React Native + Expo mobile app (main frontend)
- `server/` – FastAPI backend with authentication and AI integration
- `web/` – (Removed - migrated to mobile)
- `docs/` – MVP scope and documentation

## Quick start

### 🖥️ 1) Setup Server (Required)
```bash
cd server
./start.sh  # Auto-creates venv, installs deps, starts server
```
- Configure: Add your `GEMINI_API_KEY` to `.env` file
- Server runs at: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

### 📱 2) Setup Mobile App (Expo + React Native)
```bash
cd mobile
# Follow EXPO_SETUP.md for complete setup
npx create-expo-app ChefBot --template blank
cd ChefBot
expo install expo-image-picker expo-camera @react-native-async-storage/async-storage
expo start
```

### 🧪 3) Test the API
```bash
cd server
python test_api.py  # Test all endpoints
./get_ip.sh         # Find IP for mobile device testing
```

If you’re doing a no-code challenge, I’ll operate the steps for you when you’re ready (install, run, tweak). You just provide the API key when needed.

## Provider support
- Default: OpenAI Vision-capable models (e.g., `gpt-4o-mini`) via `OPENAI_API_KEY`.
- Gemini: set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` (e.g., `gemini-1.5-flash`).
- Selector: set `PROVIDER=auto|openai|gemini|mock` (auto prefers Gemini if both keys exist).

## Notes
- In dev without an API key, the server returns mock results so you can click around.
- Only images are supported in the MVP for simplicity and speed.

## Next steps
- Add favorites/shopping list.
- Add dietary filters and cuisine preferences.
- Progressive web app (installable) and camera capture on mobile.
