web2apk-template
> The open Android template powering [Unbeated's](https://unbeated.com) website-to-app builder.  
> Convert any website URL into a signed Android APK with AdMob ads, push notifications, and a custom splash screen.
![License](https://img.shields.io/badge/license-MIT%20%2B%20Non--Compete-blue)
![Android](https://img.shields.io/badge/Android-API%2021%2B-green)
![Kotlin](https://img.shields.io/badge/Kotlin-1.9-purple)
![AdMob](https://img.shields.io/badge/AdMob-SDK%2023-orange)
---
What this repo is
This is the Android project template used by Unbeated to build Android apps from website URLs. When a user submits their URL on Unbeated, a GitHub Actions workflow checks out this repo, injects the user's configuration as `{{TOKEN}}` replacements, runs a Gradle build, signs the APK, and uploads it to Cloudflare R2 for download.
You can use this template to build your own app from your website — see Local usage below.
---
Features
Feature	Details
WebView loader	Loads any HTTPS website. Handles back navigation, external links
AdMob Banner	Persistent bottom banner ad
AdMob Interstitial	Full-screen ad shown every N page loads (configurable)
AdMob Rewarded	User watches ad to unlock content. JS bridge: `window.UnbeatedAds.showRewardedAd()`
AdMob App Open	Full-screen ad on cold start and app resume
Custom splash screen	Logo, background color, tagline, duration — all configurable
Push notifications	Firebase FCM. Tap notification → opens specific URL in WebView
Pull to refresh	SwipeRefreshLayout wrapping WebView
Offline page	Custom "No internet" HTML page when connection lost
Progress bar	Thin bar showing page load progress
External link handling	Same-domain links stay in WebView. Other domains open in Chrome
Test mode	Swap all AdMob IDs with Google's official test IDs
No branding	100% white-label — no Unbeated attribution in the APK
---
Token reference
Every `{{TOKEN}}` in the source files is replaced at build time by `scripts/inject-tokens.js`.
Required
Token	Example
`{{APP_NAME}}`	`My App`
`{{PACKAGE_NAME}}`	`com.yourname.myapp`
`{{WEBSITE_URL}}`	`https://example.com`
`{{ADMOB_APP_ID}}`	`ca-app-pub-XXXXXXXX~XXXXXXXXXX`
AdMob ad units
Token	Ad format
`{{BANNER_UNIT_ID}}`	Banner (bottom of screen)
`{{INTERSTITIAL_UNIT_ID}}`	Interstitial (full-screen)
`{{REWARDED_UNIT_ID}}`	Rewarded video
`{{APP_OPEN_UNIT_ID}}`	App Open (on cold start)
Set `{{TEST_MODE}}` to `true` to use Google's official test IDs instead.
Feature flags (`"true"` / `"false"`)
Token	Default
`{{ENABLE_BANNER}}`	`true`
`{{ENABLE_INTERSTITIAL}}`	`true`
`{{ENABLE_REWARDED}}`	`false`
`{{ENABLE_APP_OPEN}}`	`false`
`{{ENABLE_PULL_TO_REFRESH}}`	`true`
`{{ENABLE_OFFLINE_PAGE}}`	`true`
`{{ENABLE_PROGRESS_BAR}}`	`true`
`{{ENABLE_PUSH}}`	`false`
Splash & build
Token	Default	Notes
`{{SPLASH_BG_COLOR}}`	`#FFFFFF`	Hex color
`{{SPLASH_DURATION}}`	`2000`	Milliseconds
`{{SPLASH_TAGLINE}}`	(empty)	Optional text below logo
`{{VERSION_NAME}}`	`1.0`	e.g. `2.3.1`
`{{VERSION_CODE}}`	`1`	Integer, increment each release
---
Local usage
Build an APK from your own website on your local machine.
Prerequisites
JDK 17 — Download
Android SDK — Download Android Studio or SDK tools only
Node.js 18+ — Download
`JAVA_HOME` and `ANDROID_HOME` environment variables set
Steps
1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/web2apk-template.git
cd web2apk-template
```
2. Generate a debug keystore (skip if you already have one)
```bash
keytool -genkeypair -v \
  -keystore keystore/debug.jks \
  -alias androiddebugkey \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android -keypass android
```
3. Create `keystore.properties` in the root directory
```properties
storeFile=../../keystore/debug.jks
storePassword=android
keyAlias=androiddebugkey
keyPassword=android
```
4. Set your config as environment variables
```bash
export APP_NAME="My App"
export PACKAGE_NAME="com.yourname.myapp"
export WEBSITE_URL="https://yourwebsite.com"
export ADMOB_APP_ID="ca-app-pub-XXXXXXXX~XXXXXXXXXX"
export BANNER_UNIT_ID="ca-app-pub-XXXXXXXX/XXXXXXXXXX"
export INTERSTITIAL_UNIT_ID="ca-app-pub-XXXXXXXX/XXXXXXXXXX"
export TEST_MODE="false"
export SPLASH_BG_COLOR="#1A1A2E"
export SPLASH_DURATION="2000"
```
5. Run token injection
```bash
node scripts/inject-tokens.js
node scripts/apply-package.js
```
6. Add your assets (optional)
```
app/src/main/res/drawable/splash_logo.png   ← your splash logo
app/src/main/res/mipmap-*/ic_launcher.png   ← your app icon (all densities)
app/google-services.json                    ← only needed for push notifications
```
7. Build and sign
```bash
chmod +x gradlew
./gradlew assembleRelease
```
Your signed APK will be at:
```
app/build/outputs/apk/release/app-release.apk
```
---
GitHub Actions (CI build)
This repo is designed to be triggered via `workflow_dispatch` from an external backend service. See the workflow file for the full input spec.
Required GitHub Secrets
Set these in Settings → Secrets and variables → Actions:
Secret	Description
`KEYSTORE_BASE64`	Release keystore encoded as base64: `base64 -i release.jks`
`KEYSTORE_PASS`	Keystore password
`KEY_ALIAS`	Key alias (e.g. `release`)
`KEY_PASS`	Key password
`CF_ACCOUNT_ID`	Cloudflare account ID
`CF_R2_TOKEN`	Cloudflare API token with R2:Edit permission
`R2_BUCKET_NAME`	Name of your R2 bucket (e.g. `web2apk-builds`)
`R2_PUBLIC_DOMAIN`	Custom domain for R2 (e.g. `builds.yourdomain.com`)
Trigger a build from your backend
```javascript
await fetch(
  `https://api.github.com/repos/YOUR_USERNAME/web2apk-template/actions/workflows/build-apk.yml/dispatches`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
      'Accept': 'application/vnd.github+json',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        build_id:         buildId,
        website_url:      'https://example.com',
        app_name:         'My App',
        package_name:     'com.example.myapp',
        admob_app_id:     'ca-app-pub-XXXXXXXX~XXXXXXXXXX',
        banner_unit_id:   'ca-app-pub-XXXXXXXX/XXXXXXXXXX',
        test_mode:        'false',
        webhook_url:      'https://api.yourservice.com/webhook/build',
        webhook_secret:   process.env.WEBHOOK_SECRET,
      }
    })
  }
);
```
Webhook response
When the build completes (or fails), GitHub Actions sends a POST to your `webhook_url`:
```json
{
  "buildId": "uuid",
  "status": "complete",
  "step": "Build complete",
  "progress": 100,
  "downloadUrl": "https://builds.yourdomain.com/apks/uuid/MyApp_v1.0.apk",
  "objectKey": "apks/uuid/MyApp_v1.0.apk",
  "apkFilename": "MyApp_v1.0.apk",
  "completedAt": "2026-01-01T00:00:00Z"
}
```
Verify the HMAC-SHA256 signature in `X-Signature-SHA256` before processing.
---
Rewarded ads — JS bridge
Once the APK is installed, trigger a rewarded ad from any JavaScript running on your website:
```javascript
// Check if running inside the app
const isApp = typeof window.UnbeatedAds !== 'undefined';

// Show a rewarded ad
if (isApp) {
  window.UnbeatedAds.showRewardedAd();
}

// Called when user earns the reward
window.onRewardEarned = function () {
  console.log('Reward earned — unlock content here');
};
```
---
Project structure
```
web2apk-template/
├── .github/
│   └── workflows/
│       └── build-apk.yml          ← CI/CD pipeline
├── scripts/
│   ├── inject-tokens.js           ← Token replacement engine
│   └── apply-package.js           ← Package name directory rename
├── app/
│   ├── build.gradle               ← App dependencies (AdMob, Firebase)
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── assets/
│       │   └── offline.html       ← No-internet fallback page
│       ├── java/com/template/app/
│       │   ├── App.kt             ← Application class
│       │   ├── SplashActivity.kt
│       │   ├── MainActivity.kt    ← WebView + all AdMob ad types
│       │   ├── AppOpenAdManager.kt
│       │   └── PushNotificationService.kt
│       └── res/
│           ├── drawable/          ← splash_logo placeholder
│           ├── layout/            ← activity_main.xml, activity_splash.xml
│           ├── mipmap-*/          ← ic_launcher placeholders
│           ├── values/            ← strings, colors, themes, dimens
│           └── xml/               ← network_security_config, backup_rules
├── build.gradle                   ← Root build config
├── settings.gradle
├── gradle.properties
├── gradlew / gradlew.bat
├── gradle/wrapper/
│   └── gradle-wrapper.properties
└── LICENSE
```
---
License
MIT License with Non-Compete Clause — see LICENSE.
You are free to: use this for personal projects, self-host it, contribute to it, learn from it.  
You may not: use this to operate a public service where third-party users submit a URL and receive an APK.
---
Contributing
Pull requests are welcome for bug fixes, new features, and improvements to the template.
Fork the repo
Create a feature branch: `git checkout -b feature/my-feature`
Commit: `git commit -m 'Add my feature'`
Push: `git push origin feature/my-feature`
Open a Pull Request
Please do not include any personal keystores, `google-services.json`, or API keys in your PR.
---
Built with this template
Unbeated — AI tools directory with web-to-app builder
---
Maintained by Unbeated
