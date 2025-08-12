# Chef Bot – Fridge-to-Recipe```bash
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

## Architecture

### 🔧 Server (FastAPI)
- **Authentication**: JWT-based user accounts
- **AI Integration**: Gemini AI for recipe analysis  
- **Database**: SQLite (development) with user persistence
- **Usage Tracking**: Monthly limits (10 free analyses/month)
- **API**: RESTful endpoints for mobile app

### 📱 Mobile App (React Native + Expo)
- **Camera**: Photo capture and gallery picker
- **Authentication**: Login/signup with token storage
- **Recipe Display**: Beautiful cards with ingredients and steps
- **Usage Tracking**: Monitor monthly analysis limits
- **Cross-platform**: iOS and Android from single codebase

### 🎨 Design System
Based on Chef Bot logo colors:
- Primary: `#2ba84a` (green)
- Background: `#000000` (black)
- Secondary: `#e06d06` (orange) 
- Accent: `#ffc53a` (yellow)
- Surface: `#f7f9f8` (off-white)

## Features

### ✅ Current Features
- 🔐 User authentication (signup/login)
- 📸 Camera integration for fridge photos
- 🤖 AI-powered ingredient identification
- 🍳 Recipe suggestions with cooking times
- 📊 Usage tracking and limits
- 💾 Persistent user data
- 📱 Mobile-optimized API

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
