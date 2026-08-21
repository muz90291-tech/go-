# KyraBot

A production-ready Discord.js 14 all-in-one server management bot, prepared for Railway deployment.

## Included systems

- 🛡️ Advanced moderation — ban, kick, timeout, warn, purge, lock/unlock, cases, notes, mass actions
- 🎫 Ticket system — claim, priority, close, panels and feedback
- 🎉 Giveaways — create, end, delete and reroll
- 👋 Welcome / goodbye / autorole
- ✅ Verification and auto-verification
- 🎭 Reaction roles
- 📊 Server counters and statistics
- 🎂 Birthday management
- 📝 Logging and audit dashboards
- 👥 Community applications and autoresponder
- 🔊 Join-to-create voice channels
- 🔎 Search utilities
- 🛠️ Tools — calculator, time, Unix time, password generation, color/base conversion, polls, embeds and more
- 🎮 Fun utilities
- 🔧 General utility commands

## Removed by this build

- Music / Lavalink / Riffy
- Economy / shop / gambling
- Leveling / XP / rank system

No music server is required and no economy/leveling services are loaded at runtime.

## Requirements

- Node.js 20.10+
- Discord application + bot token
- PostgreSQL in production

## Local setup

```bash
npm install
cp .env.example .env
npm start
```

Set at least:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
PORT=3000
```

`POSTGRES_URL` can be used instead of `DATABASE_URL`.

## Railway deployment

1. Create a new Railway project and deploy this repository.
2. Add a Railway PostgreSQL service.
3. Add the variables from `.env.example` to the bot service.
4. Set `DISCORD_TOKEN` and `CLIENT_ID`.
5. Set `DATABASE_URL` to the PostgreSQL service connection string.
6. Keep `PORT` unset unless you have a specific reason to override Railway's port.
7. Deploy. Railway uses the package `start` script automatically.

The included `railway.json` configures the start command and `/health` health check.

## Environment variables

### Required

- `DISCORD_TOKEN`
- `CLIENT_ID`
- `DATABASE_URL` or `POSTGRES_URL` in production

### Useful

- `OWNER_IDS`
- `PREFIX` (default: `!`)
- `NODE_ENV` (default: `development`)
- `PORT` (Railway supplies this automatically)
- `WEB_HOST` (default: `0.0.0.0`)
- `LOG_LEVEL` (default: `info`)
- `AUTO_MIGRATE` (default: `true`)
- `CORS_ORIGIN` (default: `*`)

Never commit `.env` or a real Discord token.

## Health endpoints

- `GET /health` — process/database health
- `GET /ready` — readiness status
- `GET /` — basic bot service information

## Command registration

The bot loads commands from `src/commands` and registers them globally using `CLIENT_ID`.

The `/help` command provides a category-based command center, and `/commands dashboard` can be used to manage command access per server.

## Validation before deployment

```bash
npm install
npm start
```

For a syntax-only check without installing dependencies:

```bash
find src -name '*.js' -print0 | xargs -0 -n1 node --check
```
