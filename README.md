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

**Prerequisites:** Node.js

### Quick Start

1. Install dependencies for both client and server:

   ```bash
   npm run install:all
   ```

2. Run both server and client in development mode:
   ```bash
   npm run dev
   ```

### Individual Commands

- **Server only**: `npm run dev:server` (runs on port 3000)
- **Client only**: `npm run dev:client` (runs on port 5173)
- **Build client**: `npm run build:client`

The game server will run on `http://localhost:3000` and the client will run on `http://localhost:5173`.

## Deployment

### Option 1: Deploy to Railway (Server) + Vercel (Client) - Recommended

#### Deploy Server to Railway:

1. Sign up at [Railway.app](https://railway.app)
2. Create a new project → Deploy from GitHub repo
3. Select the `server` folder
4. Railway will auto-detect Node.js and deploy
5. Add environment variables:
   - `PORT` is auto-configured
   - `CORS_ORIGIN` = your deployed client URL (e.g., `https://your-app.vercel.app`)
6. Copy your Railway server URL (e.g., `https://your-server.up.railway.app`)

#### Deploy Client to Vercel:

1. Sign up at [Vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set **Root Directory** to `client`
4. Add environment variable:
   - `VITE_SERVER_URL` = your Railway server URL
5. Deploy!

### Option 2: Deploy to Render (Server) + Netlify (Client)

#### Deploy Server to Render:

1. Sign up at [Render.com](https://render.com)
2. Create New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `server`
5. Build Command: `npm install`
6. Start Command: `node server.js`
7. Add environment variables:
   - `CORS_ORIGIN` = your deployed client URL
8. Copy your Render server URL

#### Deploy Client to Netlify:

1. Sign up at [Netlify.com](https://netlify.com)
2. Add New Site → Import from Git
3. Set **Base Directory** to `client`
4. Build Command: `npm run build`
5. Publish Directory: `dist`
6. Add environment variable:
   - `VITE_SERVER_URL` = your Render server URL
7. Deploy!

### Important Notes:

- Deploy the **server first** to get its URL
- Then add that URL to the client's environment variables
- Update the server's `CORS_ORIGIN` with the client URL after deployment
- Both platforms offer free tiers perfect for this app

### Environment Variables Summary:

**Server** (`server/.env`):
```
PORT=3000 (auto-set by hosting platforms)
CORS_ORIGIN=https://your-client-url.com
```

**Client** (`client/.env`):
```
VITE_SERVER_URL=https://your-server-url.com
```
