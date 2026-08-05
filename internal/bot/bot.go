package bot

import (
	"log"

	"github.com/bwmarrin/discordgo"

	"titanbot-go/internal/config"
	"titanbot-go/internal/database"
)

// Bot bundles the Discord session with shared dependencies that command
// handlers need (DB access, config). Passed by pointer into every handler.
type Bot struct {
	Session *discordgo.Session
	DB      *database.DB
	Config  *config.Config

	// commands maps a slash command name to its handler. Each feature file
	// (moderation.go, economy.go, ...) registers its commands into this map
	// via Register, and Bot.interactionHandler dispatches on it.
	commands map[string]*Command
}

// Command bundles a slash command's definition with its handler function,
// so registering a new feature is a single call to Register.
type Command struct {
	Definition *discordgo.ApplicationCommand
	Handler    func(b *Bot, s *discordgo.Session, i *discordgo.InteractionCreate)
}

// New builds a Bot around an existing Discord session, DB pool and config.
func New(session *discordgo.Session, db *database.DB, cfg *config.Config) *Bot {
	return &Bot{
		Session:  session,
		DB:       db,
		Config:   cfg,
		commands: make(map[string]*Command),
	}
}

// Register adds a command to the bot's routing table. Feature packages call
// this from an Install(b *Bot) function during startup.
func (b *Bot) Register(cmd *Command) {
	b.commands[cmd.Definition.Name] = cmd
}

// Definitions returns every registered command definition, ready to hand to
// ApplicationCommandBulkOverwrite.
func (b *Bot) Definitions() []*discordgo.ApplicationCommand {
	defs := make([]*discordgo.ApplicationCommand, 0, len(b.commands))
	for _, c := range b.commands {
		defs = append(defs, c.Definition)
	}
	return defs
}

// AttachHandlers wires up the discordgo event handlers that route to
// registered commands and any always-on listeners (e.g. leveling XP gain).
func (b *Bot) AttachHandlers() {
	b.Session.AddHandler(b.interactionHandler)
}

func (b *Bot) interactionHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if i.Type != discordgo.InteractionApplicationCommand {
		return
	}
	name := i.ApplicationCommandData().Name
	cmd, ok := b.commands[name]
	if !ok {
		log.Printf("[bot] no handler registered for command %q", name)
		return
	}
	cmd.Handler(b, s, i)
}

// Reply is a small helper so command handlers don't repeat the interaction
// response boilerplate for a simple text reply.
func Reply(s *discordgo.Session, i *discordgo.InteractionCreate, content string) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{Content: content},
	})
	if err != nil {
		log.Printf("[bot] failed to reply to interaction: %v", err)
	}
}
