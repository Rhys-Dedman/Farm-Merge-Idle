# Android APK (Capacitor)

Pocket Garden ships as a Vite web app wrapped with [Capacitor](https://capacitorjs.com/).  
**GitHub Pages** still uses `npm run build` (subpath base). **Android** uses `npm run build:capacitor` (`base: './'`).

## One-time setup (your PC)

1. Install **Android Studio** ([developer.android.com/studio](https://developer.android.com/studio)).
2. In Android Studio → **SDK Manager**, install:
   - Android SDK Platform (API 34+ recommended)
   - Android SDK Build-Tools
3. Ensure **JDK 17** is available (bundled with Android Studio is fine).
4. Set **JAVA_HOME** if Gradle can’t find Java (Android Studio → Settings → Build → Gradle → JDK path).

### Phone testing

- Enable **Developer options** → **USB debugging**
- Plug in USB and accept the debug prompt

## Build workflow

From the project root:

```bash
npm install
npm run cap:sync
```

`cap:sync` runs the Capacitor web build and copies `dist/` into the Android project.

### Option A — Android Studio (easiest)

```bash
npm run cap:open
```

Then click **Run** ▶ with your phone or an emulator selected.

### Option B — Debug APK on disk

```bash
npm run cap:sync
cd android
gradlew.bat assembleDebug
```

APK output:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Copy to the phone and install (allow installs from unknown sources if prompted).

### Option C — Capacitor CLI (release-style, needs signing config later)

```bash
npm run cap:sync
npx cap build android --androidreleasetype APK
```

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local web dev (unchanged) |
| `npm run build` | GitHub Pages / production web build |
| `npm run build:capacitor` | Web build for APK (`base: './'`) |
| `npm run cap:sync` | Build + copy into `android/` |
| `npm run cap:open` | Open Android Studio |
| `npm run cap:run` | Sync + run on connected device/emulator |

## Notes

- **Internet required on device** for Tailwind CDN and Google Fonts (loaded from `index.html`).
- App id: `com.infinitygames.pocketgarden` — change in `capacitor.config.ts` if needed.
- Portrait lock is set in `android/app/src/main/AndroidManifest.xml`.
- Replace launcher icons under `android/app/src/main/res/mipmap-*` when you have final art.
