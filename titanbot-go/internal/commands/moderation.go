package commands

import (
	"context"
	"fmt"

	"github.com/bwmarrin/discordgo"

	"titanbot-go/internal/bot"
)

// InstallModeration registers /ban, /kick, /warn and /cases.
func InstallModeration(b *bot.Bot) {
	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "ban",
			Description: "Ban a member from the server",
			Options: []*discordgo.ApplicationCommandOption{
				{Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: "Member to ban", Required: true},
				{Type: discordgo.ApplicationCommandOptionString, Name: "reason", Description: "Reason for the ban", Required: false},
			},
		},
		Handler: handleBan,
	})

	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "kick",
			Description: "Kick a member from the server",
			Options: []*discordgo.ApplicationCommandOption{
				{Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: "Member to kick", Required: true},
				{Type: discordgo.ApplicationCommandOptionString, Name: "reason", Description: "Reason for the kick", Required: false},
			},
		},
		Handler: handleKick,
	})

	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "warn",
			Description: "Warn a member and log a moderation case",
			Options: []*discordgo.ApplicationCommandOption{
				{Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: "Member to warn", Required: true},
				{Type: discordgo.ApplicationCommandOptionString, Name: "reason", Description: "Reason for the warning", Required: true},
			},
		},
		Handler: handleWarn,
	})

	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "cases",
			Description: "View moderation cases for a member",
			Options: []*discordgo.ApplicationCommandOption{
				{Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: "Member to look up", Required: true},
			},
		},
		Handler: handleCases,
	})
}

func handleBan(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	opts := i.ApplicationCommandData().Options
	target := opts[0].UserValue(s)
	reason := optionalString(opts, "reason", "No reason provided")

	if err := s.GuildBanCreateWithReason(i.GuildID, target.ID, reason, 0); err != nil {
		bot.Reply(s, i, fmt.Sprintf("Failed to ban %s: %v", target.Username, err))
		return
	}

	if err := logCase(b, i.GuildID, target.ID, i.Member.User.ID, "ban", reason); err != nil {
		bot.Reply(s, i, fmt.Sprintf("Banned %s, but failed to log the case: %v", target.Username, err))
		return
	}

	bot.Reply(s, i, fmt.Sprintf("🔨 Banned **%s** — %s", target.Username, reason))
}

func handleKick(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	opts := i.ApplicationCommandData().Options
	target := opts[0].UserValue(s)
	reason := optionalString(opts, "reason", "No reason provided")

	if err := s.GuildMemberDeleteWithReason(i.GuildID, target.ID, reason); err != nil {
		bot.Reply(s, i, fmt.Sprintf("Failed to kick %s: %v", target.Username, err))
		return
	}

	if err := logCase(b, i.GuildID, target.ID, i.Member.User.ID, "kick", reason); err != nil {
		bot.Reply(s, i, fmt.Sprintf("Kicked %s, but failed to log the case: %v", target.Username, err))
		return
	}

	bot.Reply(s, i, fmt.Sprintf("👢 Kicked **%s** — %s", target.Username, reason))
}

func handleWarn(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	opts := i.ApplicationCommandData().Options
	target := opts[0].UserValue(s)
	reason := opts[1].StringValue()

	if err := logCase(b, i.GuildID, target.ID, i.Member.User.ID, "warn", reason); err != nil {
		bot.Reply(s, i, fmt.Sprintf("Failed to log warning: %v", err))
		return
	}

	bot.Reply(s, i, fmt.Sprintf("⚠️ Warned **%s** — %s", target.Username, reason))
}

func handleCases(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	target := i.ApplicationCommandData().Options[0].UserValue(s)

	rows, err := b.DB.Pool.Query(context.Background(),
		`SELECT action, reason, created_at FROM mod_cases
		 WHERE guild_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 10`,
		i.GuildID, target.ID)
	if err != nil {
		bot.Reply(s, i, fmt.Sprintf("Failed to fetch cases: %v", err))
		return
	}
	defer rows.Close()

	msg := fmt.Sprintf("**Moderation history for %s:**\n", target.Username)
	found := false
	for rows.Next() {
		var action, reason string
		var createdAt any
		if err := rows.Scan(&action, &reason, &createdAt); err != nil {
			continue
		}
		found = true
		msg += fmt.Sprintf("• **%s** — %s\n", action, reason)
	}
	if !found {
		msg += "No cases on record."
	}

	bot.Reply(s, i, msg)
}

func logCase(b *bot.Bot, guildID, userID, moderatorID, action, reason string) error {
	_, err := b.DB.Pool.Exec(context.Background(),
		`INSERT INTO mod_cases (guild_id, user_id, moderator_id, action, reason)
		 VALUES ($1, $2, $3, $4, $5)`,
		guildID, userID, moderatorID, action, reason)
	return err
}

func optionalString(opts []*discordgo.ApplicationCommandInteractionDataOption, name, def string) string {
	for _, o := range opts {
		if o.Name == name {
			return o.StringValue()
		}
	}
	return def
}
