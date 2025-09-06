#!/bin/bash

# Script to get SHA-1 fingerprint for Google OAuth setup
# Run this in VS Code terminal from ChefBot directory

echo "🔑 Getting SHA-1 fingerprint for Google OAuth..."
echo ""

# Check if debug keystore exists
if [ -f ~/.android/debug.keystore ]; then
    echo "📱 Debug keystore found. Getting SHA-1 fingerprint:"
    echo ""
    keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
    echo ""
else
    echo "⚠️  Debug keystore not found at ~/.android/debug.keystore"
    echo ""
    echo "📋 You can use this default Expo SHA-1 for testing:"
    echo "SHA1: 58:E1:C5:71:7A:F1:BE:BD:B9:66:67:E7:FC:58:50:ED:0F:6B:13:18"
    echo ""
fi

echo "🔧 Alternative method: Run 'npx eas credentials' for Expo managed workflow"
echo ""
echo "📋 Copy the SHA1 fingerprint and paste it in Google Cloud Console:"
echo "   - Go to APIs & Services → Credentials"
echo "   - Edit your Android OAuth client"
echo "   - Paste the SHA1 in the 'SHA-1 certificate fingerprint' field"
