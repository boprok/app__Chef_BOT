# Web Frontend Removed

The web frontend has been removed as part of the migration to React Native + Expo.

## What was here:
- HTML/CSS/JS web application
- Service worker for PWA features
- Web manifest for app installation
- Frontend authentication and camera integration

## Where to find it now:
- **Logo**: Preserved in `../mobile/assets/images/logo.svg`
- **Server API**: Still available in `../server/`
- **Mobile App**: New React Native development in `../mobile/`

## Server Integration
The server in `../server/` continues to provide the same API endpoints for the mobile app:
- Authentication: `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`
- Recipe Analysis: `/api/analyze`
- Health Check: `/api/health`

Start the server with:
```bash
cd ../server
./start.sh
```

## Mobile Development
Create your React Native + Expo app in the `../mobile/` folder to replace this web frontend.
