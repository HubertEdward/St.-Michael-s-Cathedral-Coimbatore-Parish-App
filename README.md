# St. Michael's Cathedral, Coimbatore — Parish App

A parishioner app for Android and iOS, and a web admin app for the parish office, built with Expo SDK 57.

The analysis, decisions and the full development plan are in the project document:
[St. Michael's Cathedral Parish App — Analysis & Development Plan](https://claude.ai/artifact/VBdCWYEbpVvnV1Q9wE22xW).

## Status: Phase 1 (static app + working mocks)

| Area | State |
| --- | --- |
| Parishioner app | Home with next Mass, weekly timetable, news and events, about, contact and directions, sacraments guide, prayers and today's Rosary, ministries, duty rosters, Mass-intention and certificate requests, Tamil and English |
| Admin web app | Dashboard, timetable editor, announcements, events, Mass-intention queue with a printable priest's list, certificate requests, ministry rosters |
| Data | Demo store on each device (AsyncStorage / localStorage). The two apps do not share data until the Phase 2 backend |
| Content | Gathered from public listings; see [docs/CONTENT_CHECKLIST.md](docs/CONTENT_CHECKLIST.md) for what the parish office must confirm |

## Layout

```
apps/mobile      Parishioner app (Expo Router, React Native Paper, i18next)
apps/admin       Parish office web app (Expo Router web, React Native Paper)
packages/core    Shared: types, bundled content, schedule logic, validation (zod),
                 data functions and TanStack Query hooks, Material 3 theme
```

Screens only call the data functions in `packages/core/src/data/api.ts`. In Phase 2 the demo store
(`packages/core/src/data/store.ts`) is replaced by the backend client; screens do not change.

## Run it

Requires Node 22 and npm.

```bash
npm install
npm run mobile     # Expo dev server for the parishioner app; scan the QR code with Expo Go
npm run admin      # admin web app in the browser
npm run typecheck  # all workspaces
npm test           # schedule logic tests
```

## Build for the stores

The parishioner app builds with EAS (`apps/mobile/eas.json`):

```bash
cd apps/mobile
npx eas build --profile preview --platform android   # installable APK for testing
npx eas build --profile production --platform all    # store builds
```

The bundle identifier `in.stmichaelscathedral.parish` is a proposal; confirm it before the first store upload,
because it cannot be changed afterwards.

## Editing content

- Parish facts, clergy, history: `packages/core/src/content/parish.ts`
- Sacraments, prayers, ministries: `packages/core/src/content/`
- Starting timetable and sample news: `packages/core/src/data/seed.ts`
- Interface text: `apps/mobile/src/i18n/en.ts` and `ta.ts`

Bilingual text is `{ en, ta }`; when Tamil is missing the app shows English.
