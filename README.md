# WatchBuddy

A responsive watch-party app with private LiveKit rooms, real WebRTC screen sharing, and live voice chat. The frontend is a Vite/React SPA; Netlify Functions hold the LiveKit API secret and issue short-lived room tokens.

## Requirements

- Node.js 20 or newer and npm
- A LiveKit Cloud project (or a reachable self-hosted LiveKit server)
- A Netlify site for deployed use

## Run locally

1. Install packages: `npm install`
2. Copy `.env.example` to `.env` and set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` from your LiveKit project.
3. Run `npm run dev` and open the local URL printed by Netlify CLI (typically `http://localhost:8888`).

`npm run dev` starts both the Vite frontend and Netlify Functions. Room creation and joining require the functions; do not use `npm run dev:vite` or `npm run preview` for a full local room test.

## Deploy to Netlify

1. Push this project to your Git provider and import it into Netlify.
2. Netlify detects the settings in `netlify.toml`: build command `npm run build`, publish directory `dist`, and functions directory `netlify/functions`.
3. In **Site configuration → Environment variables**, add:
   - `LIVEKIT_URL` — your LiveKit WebSocket URL, e.g. `wss://your-project.livekit.cloud`
   - `LIVEKIT_API_KEY` — the LiveKit API key
   - `LIVEKIT_API_SECRET` — the corresponding secret
4. Trigger a deploy. The SPA fallback in `netlify.toml` supports refreshing `/room/:roomId` invitation links.

Never put the LiveKit secret in a `VITE_` variable or browser code. The Netlify functions need server-side access to it.

## How it works

- `create-room` generates a cryptographically random room ID, creates the LiveKit room, and returns a six-hour participant token.
- `join-room` checks that the room exists before issuing a token. Room IDs are private bearer invitation links; anyone who has one can join.
- LiveKit transports microphone audio and screen-share tracks peer-to-peer through its WebRTC infrastructure (SFU). Participants and track state update from the LiveKit connection.
- Screen sharing is started only after a user action and browser permission through LiveKit's `getDisplayMedia` flow. Browser support and available capture sources depend on the browser and operating system.
- Empty rooms are cleaned up after five minutes by LiveKit. If a creator leaves while others remain, the room continues for those participants; it is cleaned up when empty.
- Media is not recorded or stored by this app. LiveKit Cloud's service configuration and retention policies are managed in your LiveKit account.

## Browser and permissions

Use a modern browser on HTTPS (Netlify provides HTTPS). Allow microphone access for voice chat and choose a screen/window/tab in the browser's sharing prompt. Screen capture generally requires a user gesture and is not available in every embedded/mobile browser. If capture is unavailable, try a current desktop version of Chrome, Edge, or Firefox.

## Production checks

Run `npm run build` to type-check and create the static production bundle. The real-time room flows additionally require valid LiveKit credentials and two separately permissioned browser sessions; those credentials/devices are not included in this repository.
