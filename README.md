<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This project is separated into client and server folders for better organization.

View your app in AI Studio: https://ai.studio/apps/drive/1zvQ93ajTz6X2TCjHv6maRmNIiXcUALxg

## Project Structure

```
Blocks/
├── client/          # React frontend application
│   ├── components/  # React components
│   ├── utils/       # Game logic and utilities
│   ├── App.tsx
│   ├── index.tsx
│   └── package.json
├── server/          # Socket.io game server
│   ├── server.js
│   └── package.json
├── package.json     # Root package.json with workspace scripts
└── README.md
```

## Run Locally

**Prerequisites:** 
- Node.js
- PostgreSQL (see [LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md) for setup)
- Docker (optional, recommended for PostgreSQL)

### Quick Start with Docker

1. Start PostgreSQL database:
   ```bash
   cd server
   docker-compose up -d
   ```

2. Install dependencies for both client and server:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env if needed (default values work with Docker setup)
   ```

4. Run both server and client in development mode:
   ```bash
   npm run dev
   ```

### Without Docker

See [LOCAL_POSTGRES_SETUP.md](LOCAL_POSTGRES_SETUP.md) for native PostgreSQL installation instructions.

### Individual Commands

- **Server only**: `npm run dev:server` (runs on port 3000)
- **Client only**: `npm run dev:client` (runs on port 5173)
- **Build client**: `npm run build:client`

The game server will run on `http://localhost:3000` and the client will run on `http://localhost:5173`.
