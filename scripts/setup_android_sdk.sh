#!/bin/bash
set -e

SDK_DIR="/app/applet/android-sdk"
mkdir -p "$SDK_DIR/cmdline-tools"

if [ ! -d "$SDK_DIR/cmdline-tools/latest" ]; then
    echo "Downloading Android Commandline Tools..."
    curl -sL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o /tmp/cmdline-tools.zip
    unzip -q /tmp/cmdline-tools.zip -d "$SDK_DIR/cmdline-tools"
    mv "$SDK_DIR/cmdline-tools/cmdline-tools" "$SDK_DIR/cmdline-tools/latest"
    rm -f /tmp/cmdline-tools.zip
fi

export ANDROID_HOME="$SDK_DIR"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

echo "Accepting licenses..."
yes | sdkmanager --licenses > /dev/null 2>&1 || true

echo "Installing Android 34 platforms and build-tools..."
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" > /dev/null 2>&1

echo "Android SDK setup complete!"
