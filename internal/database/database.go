package database

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps a pgx connection pool.
type DB struct {
	Pool *pgxpool.Pool
}

// Connect opens a connection pool to PostgreSQL and runs migrations.
func Connect(ctx context.Context, url string) (*DB, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("connect to postgres: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	db := &DB{Pool: pool}
	if err := db.migrate(ctx); err != nil {
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	log.Println("[database] connected and migrated")
	return db, nil
}

// Close closes the connection pool.
func (db *DB) Close() {
	db.Pool.Close()
}

// migrate creates all tables used by the bot's features if they don't exist yet.
// Each feature phase adds its tables here. Kept in one file for now since the
// schema is still small; split into internal/database/migrations/*.sql once
// it grows (tickets, giveaways, birthdays, reaction roles, etc. will add more).
func (db *DB) migrate(ctx context.Context) error {
	stmts := []string{
		// Economy
		`CREATE TABLE IF NOT EXISTS economy_accounts (
			guild_id    TEXT NOT NULL,
			user_id     TEXT NOT NULL,
			balance     BIGINT NOT NULL DEFAULT 0,
			bank        BIGINT NOT NULL DEFAULT 0,
			last_work   TIMESTAMPTZ,
			last_daily  TIMESTAMPTZ,
			PRIMARY KEY (guild_id, user_id)
		)`,
		`CREATE TABLE IF NOT EXISTS shop_items (
			id          SERIAL PRIMARY KEY,
			guild_id    TEXT NOT NULL,
			name        TEXT NOT NULL,
			description TEXT,
			price       BIGINT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS inventory (
			guild_id    TEXT NOT NULL,
			user_id     TEXT NOT NULL,
			item_id     INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
			quantity    INTEGER NOT NULL DEFAULT 1,
			PRIMARY KEY (guild_id, user_id, item_id)
		)`,

		// Moderation
		`CREATE TABLE IF NOT EXISTS mod_cases (
			id          SERIAL PRIMARY KEY,
			guild_id    TEXT NOT NULL,
			user_id     TEXT NOT NULL,
			moderator_id TEXT NOT NULL,
			action      TEXT NOT NULL,
			reason      TEXT,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
		`CREATE TABLE IF NOT EXISTS user_notes (
			id          SERIAL PRIMARY KEY,
			guild_id    TEXT NOT NULL,
			user_id     TEXT NOT NULL,
			author_id   TEXT NOT NULL,
			note        TEXT NOT NULL,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,

		// Leveling
		`CREATE TABLE IF NOT EXISTS levels (
			guild_id    TEXT NOT NULL,
			user_id     TEXT NOT NULL,
			xp          BIGINT NOT NULL DEFAULT 0,
			level       INTEGER NOT NULL DEFAULT 0,
			last_xp_at  TIMESTAMPTZ,
			PRIMARY KEY (guild_id, user_id)
		)`,
		`CREATE TABLE IF NOT EXISTS level_roles (
			guild_id    TEXT NOT NULL,
			level       INTEGER NOT NULL,
			role_id     TEXT NOT NULL,
			PRIMARY KEY (guild_id, level)
		)`,

		// Guild settings (used by welcome, tickets, stats, giveaways, birthdays, reaction roles)
		`CREATE TABLE IF NOT EXISTS guild_settings (
			guild_id       TEXT PRIMARY KEY,
			welcome_channel TEXT,
			welcome_message TEXT,
			autorole_id     TEXT,
			ticket_category TEXT,
			log_channel     TEXT
		)`,
	}

	for _, stmt := range stmts {
		if _, err := db.Pool.Exec(ctx, stmt); err != nil {
			return fmt.Errorf("exec migration: %w\nstatement: %s", err, stmt)
		}
	}
	return nil
}
