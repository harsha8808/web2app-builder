# AdMob
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# WebView JavaScript interface — must not be obfuscated
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep app classes
-keep class com.template.app.** { *; }
