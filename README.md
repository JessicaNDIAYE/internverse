# InternVerse 🏢

A real-time multiplayer browser game inspired by MovieStarPlanet — but set in the chaotic world of corporate internships.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TailwindCSS, Zustand, Socket.io-client |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT + bcrypt |

## Project Structure

```
internverse/
├── server/          Express + Socket.io backend
│   ├── src/
│   │   ├── index.ts         Entry point
│   │   ├── routes/          REST API (auth, users, companies)
│   │   ├── sockets/         Real-time socket handlers
│   │   ├── middleware/       JWT auth middleware
│   │   └── lib/             Prisma client + seed script
│   └── prisma/schema.prisma Database schema
├── client/          Next.js frontend
│   └── src/
│       ├── app/             Pages (App Router)
│       │   ├── (auth)/      Login + signup
│       │   └── game/        Hub, mini-games, profiles
│       ├── components/      Shared UI components
│       ├── store/           Zustand state (auth, chat, game)
│       └── lib/             API client + Socket.io singleton
└── shared/          Shared TypeScript types
```

## Setup

### 1. Database

```bash
# Create a PostgreSQL database named 'internverse'
# Copy the env file and fill in your DB URL
cp server/.env.example server/.env
cp client/.env.local.example client/.env.local
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Push schema + seed companies

```bash
npm run db:push
npm run db:seed
```

### 4. Run in development

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:3001

## Features

### Auth
- Email + password signup/login
- JWT tokens (7-day expiry)
- Persistent sessions via localStorage

### Companies
- 5 pre-seeded companies (TechNova, MegaCorp, StartupHive, Synergy Inc., Disruptify)
- Players join one company per account
- Company acts as a game server (shared chat + leaderboard)

### Real-time Chat (Socket.io)
- Instant message broadcast within company room
- Online player list with level badges
- Join/leave notifications

### Mini-Games

**🐛 Bug Hunt**
- 6 rotating code snippets, each with one hidden bug
- Click the bug token as fast as possible
- Speed bonus: more points for faster clicks
- 60 second timer

**📧 Email Chaos**
- Sort incoming emails into Urgent / Normal / Spam
- 18 unique email templates
- Streak multiplier (3+ correct = bonus points)
- Increasing difficulty (shorter time limits per email)

### XP & Level System
- XP earned from every game
- Level = `floor(sqrt(xp/100)) + 1`
- Automatic level-up notification
- Stats: XP, Level, Reputation, Productivity, Creativity

### Leaderboard
- Per-company, top 20 by XP
- Real-time updates via Socket.io after each game
- Clickable player entries → profile modal

### Player Profiles
- Clickable anywhere a player appears in chat or leaderboard
- Shows full stats + recent game history

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `company:join` | Client → Server | Join/switch company room |
| `chat:message` | Bidirectional | Send/receive chat messages |
| `online:list` | Server → Client | Updated list of online players |
| `player:joined` | Server → Client | Someone joined the company |
| `player:left` | Server → Client | Someone left |
| `game:join` | Client → Server | Join a game room |
| `game:score_update` | Bidirectional | Live score updates |
| `game:end` | Client → Server | Submit final score |
| `game:results` | Server → Client | Final rankings for the room |
| `leaderboard:update` | Server → Client | Updated leaderboard |
| `leaderboard:request` | Client → Server | Request current leaderboard |
