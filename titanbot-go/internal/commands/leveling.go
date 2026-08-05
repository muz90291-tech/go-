package commands

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/jackc/pgx/v5"

	"titanbot-go/internal/bot"
)

const xpCooldown = 60 * time.Second

// InstallLeveling registers /rank and the message-based XP listener.
func InstallLeveling(b *bot.Bot) {
	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "rank",
			Description: "Check your (or someone else's) level and XP",
			Options: []*discordgo.ApplicationCommandOption{
				{Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: "Whose rank to check", Required: false},
			},
		},
		Handler: handleRank,
	})

	b.Session.AddHandler(func(s *discordgo.Session, m *discordgo.MessageCreate) {
		handleXPGain(b, s, m)
	})
}

func handleRank(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	target := i.Member.User
	if opts := i.ApplicationCommandData().Options; len(opts) > 0 {
		target = opts[0].UserValue(s)
	}

	var xp int64
	var level int
	err := b.DB.Pool.QueryRow(context.Background(),
		`SELECT xp, level FROM levels WHERE guild_id=$1 AND user_id=$2`,
		i.GuildID, target.ID).Scan(&xp, &level)
	if err == pgx.ErrNoRows {
		bot.Reply(s, i, fmt.Sprintf("**%s** hasn't earned any XP yet.", target.Username))
		return
	}
	if err != nil {
		bot.Reply(s, i, fmt.Sprintf("Failed to fetch rank: %v", err))
		return
	}

	bot.Reply(s, i, fmt.Sprintf("📈 **%s** is level **%d** with **%d** XP.", target.Username, level, xp))
}

// handleXPGain awards XP for a message, subject to a per-user cooldown, and
// handles level-ups (including assigning any configured level role).
func handleXPGain(b *bot.Bot, s *discordgo.Session, m *discordgo.MessageCreate) {
	if m.Author.Bot || m.GuildID == "" {
		return
	}
	ctx := context.Background()

	var lastXPAt *time.Time
	var currentXP int64
	var currentLevel int
	err := b.DB.Pool.QueryRow(ctx,
		`SELECT xp, level, last_xp_at FROM levels WHERE guild_id=$1 AND user_id=$2`,
		m.GuildID, m.Author.ID).Scan(&currentXP, &currentLevel, &lastXPAt)
	if err != nil && err != pgx.ErrNoRows {
		return
	}
	if lastXPAt != nil && time.Since(*lastXPAt) < xpCooldown {
		return
	}

	gained := int64(15 + rand.Intn(11)) // 15-25 XP per message
	newXP := currentXP + gained
	newLevel := levelForXP(newXP)

	_, err = b.DB.Pool.Exec(ctx,
		`INSERT INTO levels (guild_id, user_id, xp, level, last_xp_at)
		 VALUES ($1, $2, $3, $4, now())
		 ON CONFLICT (guild_id, user_id)
		 DO UPDATE SET xp = $3, level = $4, last_xp_at = now()`,
		m.GuildID, m.Author.ID, newXP, newLevel)
	if err != nil {
		return
	}

	if newLevel > currentLevel {
		announceLevelUp(b, s, m.GuildID, m.ChannelID, m.Author, newLevel)
	}
}

// levelForXP uses the same style of curve as most Discord leveling bots:
// XP needed for level n is 5*(n^2) + 50*n + 100.
func levelForXP(xp int64) int {
	level := 0
	for xpForLevel(level+1) <= xp {
		level++
	}
	return level
}

func xpForLevel(level int) int64 {
	l := int64(level)
	return 5*l*l + 50*l + 100
}

func announceLevelUp(b *bot.Bot, s *discordgo.Session, guildID, channelID string, user *discordgo.User, newLevel int) {
	_, _ = s.ChannelMessageSend(channelID, fmt.Sprintf("🎉 **%s** just reached level **%d**!", user.Username, newLevel))

	var roleID string
	err := b.DB.Pool.QueryRow(context.Background(),
		`SELECT role_id FROM level_roles WHERE guild_id=$1 AND level=$2`,
		guildID, newLevel).Scan(&roleID)
	if err == nil && roleID != "" {
		_ = s.GuildMemberRoleAdd(guildID, user.ID, roleID)
	}
}
