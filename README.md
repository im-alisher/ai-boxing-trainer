# AI Boxing Trainer

A real-time computer vision boxing coach powered entirely by local AI.

Runs 100% in the browser. No paid APIs. No cloud AI services. No backend.

## Stack

- React 19 + TypeScript (strict)
- Vite
- TailwindCSS v4
- MediaPipe Pose / MediaPipe Tasks Vision
- HTML Canvas

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start the development server  |
| `npm run build`   | Type-check and build for prod |
| `npm run lint`    | Lint with ESLint              |
| `npm run format`  | Format with Prettier          |
| `npm run preview` | Preview the production build  |

## Architecture

Feature-based structure under `src/`:

```
src/
├── components/   # Presentational UI components
├── features/     # Feature modules (webcam, pose, punches, HUD)
├── hooks/        # Reusable React hooks
├── services/     # Reusable services (webcam, pose engine)
├── game/         # Game/render logic
├── types/        # Shared TypeScript types
└── utils/        # Pure helper utilities
```
