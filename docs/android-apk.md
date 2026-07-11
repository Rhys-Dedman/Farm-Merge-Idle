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
- **App / notification icon source:** `public/assets/ui/generic/app_icon.png` (also copied to `resources/icon.png` for future iOS).
  - Android launcher mipmaps + `drawable/ic_stat_pocket_garden` are generated from that sprite.
  - Re-run icon generation after replacing `app_icon.png`, then `npm run cap:sync`.

### Local notifications (return reminders)

- Uses `@capacitor/local-notifications` (Android now; same code path for iOS when `ios/` is added).
- **Does not fire in `npm run dev` / browser** — test on a device or emulator APK after `npm run cap:sync`.
- Permission is requested once after main FTUE completes (Settings → **Reminders** can toggle off/on).
- Timing / copy in `constants/localNotificationSettings.ts`:
  - Soft ping **~4h** after leave (pushed out of quiet hours if needed)
  - Follow-up at next **09:00** or **19:00** local
  - Quiet hours **22:00–08:00** local
  - Max **2** delivered reminders per local calendar day
  - Copy pools: offline / daily tasks / anytime / morning / evening
  - Morning prefers daily tasks; daily-task lines are morning-only (reset timing)
  - Morning/evening-only lines stay in their slots
  - Never the same copy category twice in a row
