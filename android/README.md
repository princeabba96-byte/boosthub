# BoostHub Hybrid Native Android Project
**Package**: `com.boosthub.society`  
**Architecture**: Native Hybrid App (Native BottomNavigationView + Native Pull-to-Refresh + Native Offline Error Recovery + Native Firebase Cloud Messaging Push Notifications + Safe Zoom-Disabled Hardware Accelerated WebView)

---

## 1. Project Directory Structure & google-services.json Placement
Place your Firebase `google-services.json` file inside the `app/` folder:

```text
android/
  ├── build.gradle.kts                # Project-level Gradle build configuration
  ├── settings.gradle.kts             # Subproject settings & repositories
  ├── gradle.properties               # AndroidX & JVM optimization flags
  ├── gradlew                         # Gradle wrapper shell script
  └── app/
       ├── build.gradle.kts           # Module-level build file with FCM & AndroidX
       ├── google-services.json       # <<< PLACE YOUR FIREBASE CONFIG FILE HERE!
       ├── proguard-rules.pro         # Proguard rules for JS interface & FCM
       └── src/main/
            ├── AndroidManifest.xml   # Manifest with com.boosthub.society package
            ├── java/com/boosthub/society/
            │    ├── MainActivity.kt               # Native toolbar, bottom nav, pull-to-refresh & offline handler
            │    ├── SplashActivity.kt             # Native splash screen with brand logo
            │    ├── MyFirebaseMessagingService.kt # Real FCM native push notification service
            │    └── WebAppInterface.kt            # Bidirectional JS-to-Native bridge
            └── res/
                 ├── layout/
                 │    ├── activity_main.xml        # CoordinatorLayout with Native Toolbar, WebView, Offline view & BottomNavigationView
                 │    └── activity_splash.xml      # Native splash screen layout
                 ├── menu/
                 │    └── bottom_nav_menu.xml      # 5 Exact website tabs: Home, Capshots, Friends, Alerts, Menu
                 └── values/
                      ├── colors.xml               # Dark mode color palette
                      ├── strings.xml              # Labels & channel definitions
                      └── themes.xml               # Material dark theme
```

---

## 2. Uptodown Reviewer Notes

Copy and paste the following notes into your Uptodown submission:

```text
Dear Uptodown Review Team,

We have completely rebuilt the BoostHub Android app from the ground up as a full Hybrid Native application (Package: com.boosthub.society) to strictly comply with Uptodown store guidelines regarding native feature enhancement.

Key Native Implementations:
1. Native BottomNavigationView: The navigation is powered by Android's native Material BottomNavigationView, mapping to the platform's core content sections (Home, Capshots, Friends, Alerts, Menu) with instant native tactile feedback.
2. Real Native Push Notifications (Firebase Cloud Messaging): Integrated native FCM service (MyFirebaseMessagingService) with Android Notification Channels, heads-up priority alerts, sound, vibration, and deep-link intent handling.
3. Native Pull-to-Refresh (SwipeRefreshLayout): Users can swipe down natively to refresh any screen.
4. Native Offline Detection & Recovery: When connectivity drops, the app immediately intercepts the event via Android ConnectivityManager and displays a native offline recovery screen with an interactive "Retry Connection" button.
5. Native Splash Screen (SplashActivity): Native brand launch screen with hardware acceleration.
6. Native Back Navigation Stack: Hardware back button handling prevents accidental app exit and manages the internal browsing history smoothly.
7. Anti-Zoom Stability: All viewport and touch gestures have been configured to prevent accidental zoom, guaranteeing steady UI navigation.

No artificial or non-existent sections (such as fake wallets or external stores) were added; all content aligns with the verified BoostHub creator platform.

Thank you for reviewing our updated hybrid release!
```
