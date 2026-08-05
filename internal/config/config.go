package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration loaded from the environment.
type Config struct {
	DiscordToken string
	ClientID     string
	GuildID      string
	MultiGuild   bool

	PostgresURL string
	LogLevel    string
}

// Load reads .env (if present) and environment variables into a Config.
func Load() (*Config, error) {
	// It's fine if .env doesn't exist (e.g. in Docker, env vars are injected directly).
	_ = godotenv.Load()

	cfg := &Config{
		DiscordToken: os.Getenv("DISCORD_TOKEN"),
		ClientID:     os.Getenv("CLIENT_ID"),
		GuildID:      os.Getenv("GUILD_ID"),
		MultiGuild:   parseBool(os.Getenv("MULTI_GUILD")),
		PostgresURL:  os.Getenv("POSTGRES_URL"),
		LogLevel:     envOrDefault("LOG_LEVEL", "info"),
	}

	return cfg, nil
}

func parseBool(v string) bool {
	b, err := strconv.ParseBool(v)
	if err != nil {
		return false
	}
	return b
}

func envOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
