# TitanBot (Go port)

A Go rewrite of [TitanBot](https://github.com/codebymitch/TitanBot), using
[discordgo](https://github.com/bwmarrin/discordgo) and PostgreSQL
([pgx](https://github.com/jackc/pgx)).

This is being built in phases, since the original is a large multi-feature
bot. **Phase 1 (this drop)** covers the foundation plus three feature sets:

- ✅ Project structure, config loading, PostgreSQL connection + migrations
- ✅ Moderation: `/ban`, `/kick`, `/warn`, `/cases`
- ✅ Economy: `/balance`, `/work`, `/pay`, `/gamble`
- ✅ Leveling: XP-on-message, `/rank`, auto level-up + level roles

**Not yet ported (next phases):**
- ⬜ Ticket system (create/claim/close, transcripts)
- ⬜ Giveaways
- ⬜ Birthday announcements
- ⬜ Welcome messages / autorole
- ⬜ Reaction roles
- ⬜ Server stats channels (member count, boost count, etc.)
- ⬜ Shop/inventory commands (tables already exist in the schema)

Ask for any of these by name and it'll be added the same way as the phase 1
features — its own file in `internal/commands/`, registered in `cmd/bot/main.go`.

## Project layout

```
cmd/bot/main.go            entrypoint: config, DB, session, command registration
internal/config/           env/config loading
internal/database/         pgx pool + migrations
internal/models/           shared structs
internal/bot/               Bot struct, command router, reply helper
internal/commands/         one file per feature (moderation.go, economy.go, leveling.go, ...)
```

Adding a feature always follows the same shape: define the slash command(s)
in a new `internal/commands/<feature>.go` with an `InstallX(b *bot.Bot)`
function, then call it from `main.go`.

## Setup

1. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN`, `CLIENT_ID`,
   `GUILD_ID`, and `POSTGRES_URL` (or the individual `POSTGRES_*` vars if
   running via `docker-compose`, which builds the URL for you).
2. Fetch dependencies (needs network access — this environment doesn't have
   Go installed, so this hasn't been run/compiled here):
   ```
   go mod tidy
   ```
3. Run directly:
   ```
   go run ./cmd/bot
   ```
   or with Docker:
   ```
   docker compose up --build
   ```

## Notes

- Slash commands are registered per-guild (`GUILD_ID`) for instant updates
  during development. For a public multi-server bot, register them globally
  instead (pass an empty guild ID to `ApplicationCommandBulkOverwrite`) —
  global commands take up to an hour to propagate.
- The `levels` XP curve (`5*level² + 50*level + 100`) matches the common
  MEE6-style curve most Discord leveling bots use; adjust
  `internal/commands/leveling.go` if TitanBot's original curve differs.
- Since this was written without a Go toolchain available in this session,
  it hasn't been compiled/tested — run `go build ./...` after `go mod tidy`
  and fix any straggling import/type issues before deploying.
