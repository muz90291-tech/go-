package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/bwmarrin/discordgo"

	"titanbot-go/internal/bot"
	"titanbot-go/internal/commands"
	"titanbot-go/internal/config"
	"titanbot-go/internal/database"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[main] failed to load config: %v", err)
	}
	if cfg.DiscordToken == "" {
		log.Fatal("[main] DISCORD_TOKEN is not set")
	}

	ctx := context.Background()

	db, err := database.Connect(ctx, cfg.PostgresURL)
	if err != nil {
		log.Fatalf("[main] failed to connect to database: %v", err)
	}
	defer db.Close()

	session, err := discordgo.New("Bot " + cfg.DiscordToken)
	if err != nil {
		log.Fatalf("[main] failed to create discord session: %v", err)
	}
	session.Identify.Intents = discordgo.IntentsGuilds |
		discordgo.IntentsGuildMessages |
		discordgo.IntentsMessageContent |
		discordgo.IntentsGuildMembers

	b := bot.New(session, db, cfg)

	// Phase 1 feature set. Later phases (tickets, giveaways, birthdays,
	// welcome, reaction roles, server stats) each get their own
	// commands.InstallX(b) call here once built.
	commands.InstallModeration(b)
	commands.InstallEconomy(b)
	commands.InstallLeveling(b)

	b.AttachHandlers()

	if err := session.Open(); err != nil {
		log.Fatalf("[main] failed to open discord session: %v", err)
	}
	defer session.Close()

	registered, err := session.ApplicationCommandBulkOverwrite(cfg.ClientID, cfg.GuildID, b.Definitions())
	if err != nil {
		log.Fatalf("[main] failed to register slash commands: %v", err)
	}
	log.Printf("[main] registered %d slash commands", len(registered))

	log.Println("[main] TitanBot (Go) is running. Press Ctrl+C to exit.")

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("[main] shutting down...")
}
