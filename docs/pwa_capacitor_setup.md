# PWA + Capacitor Setup

AllerFit uses one Vite/React codebase for web, PWA, and native app builds.

## PWA

PWA is configured through `vite-plugin-pwa` in `vite.config.ts`.

Generated build files include:

- `manifest.webmanifest`
- `registerSW.js`
- `sw.js`

Build and preview:

```sh
npm run build
npm run preview
```

Menu and brand images are not precached during install because the image set can
be large. They are cached at runtime when users view them.

## Capacitor

Capacitor reads from `dist` through `capacitor.config.ts`.

Common commands:

```sh
npm run cap:sync
npm run cap:open:ios
npm run cap:open:android
```

The native app id is currently:

```text
com.allerfit.app
```

## Local Native Tooling Notes

iOS requires a full Xcode installation selected with `xcode-select`.

Android requires a valid JDK path in `JAVA_HOME` and Android Studio/SDK setup.

