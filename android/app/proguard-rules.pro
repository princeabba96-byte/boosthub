# Add project specific ProGuard rules here.
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.boosthub.society.WebAppInterface { *; }
-keepclassmembers class com.boosthub.society.WebAppInterface { *; }

# Keep Firebase Messaging
-keep class com.google.firebase.messaging.** { *; }
-dontwarn com.google.firebase.messaging.**
