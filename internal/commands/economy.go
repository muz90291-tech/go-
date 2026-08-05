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

const workCooldown = 1 * time.Hour

// InstallEconomy registers /balance, /work, /pay and /gamble.
func InstallEconomy(b *bot.Bot) {
	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "balance",
			Description: "Check your (or someone else's) wallet balance",
			Options: []*discordgo.ApplicationCommandOption{
				{Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: "Whose balance to check", Required: false},
			},
		},
		Handler: handleBalance,
	})

	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "work",
			Description: "Work a shift to earn coins",
		},
		Handler: handleWork,
	})

	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "pay",
			Description: "Send coins to another member",
			Options: []*discordgo.ApplicationCommandOption{
				{Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: "Recipient", Required: true},
				{Type: discordgo.ApplicationCommandOptionInteger, Name: "amount", Description: "Amount to send", Required: true, MinValue: floatPtr(1)},
			},
		},
		Handler: handlePay,
	})

	b.Register(&bot.Command{
		Definition: &discordgo.ApplicationCommand{
			Name:        "gamble",
			Description: "Risk some coins for a chance to double them",
			Options: []*discordgo.ApplicationCommandOption{
				{Type: discordgo.ApplicationCommandOptionInteger, Name: "amount", Description: "Amount to gamble", Required: true, MinValue: floatPtr(1)},
			},
		},
		Handler: handleGamble,
	})
}

func handleBalance(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	target := i.Member.User
	if opts := i.ApplicationCommandData().Options; len(opts) > 0 {
		target = opts[0].UserValue(s)
	}

	acc, err := getOrCreateAccount(b, i.GuildID, target.ID)
	if err != nil {
		bot.Reply(s, i, fmt.Sprintf("Failed to fetch balance: %v", err))
		return
	}

	bot.Reply(s, i, fmt.Sprintf("💰 **%s** has **%d** coins in wallet and **%d** in the bank.", target.Username, acc.Balance, acc.Bank))
}

func handleWork(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	userID := i.Member.User.ID
	ctx := context.Background()

	var lastWork *time.Time
	err := b.DB.Pool.QueryRow(ctx,
		`SELECT last_work FROM economy_accounts WHERE guild_id=$1 AND user_id=$2`,
		i.GuildID, userID).Scan(&lastWork)
	if err != nil && err != pgx.ErrNoRows {
		bot.Reply(s, i, fmt.Sprintf("Something went wrong: %v", err))
		return
	}

	if lastWork != nil && time.Since(*lastWork) < workCooldown {
		remaining := workCooldown - time.Since(*lastWork)
		bot.Reply(s, i, fmt.Sprintf("⏳ You're tired. Try again in %s.", remaining.Round(time.Second)))
		return
	}

	earnings := int64(50 + rand.Intn(151)) // 50-200 coins
	_, err = b.DB.Pool.Exec(ctx,
		`INSERT INTO economy_accounts (guild_id, user_id, balance, last_work)
		 VALUES ($1, $2, $3, now())
		 ON CONFLICT (guild_id, user_id)
		 DO UPDATE SET balance = economy_accounts.balance + $3, last_work = now()`,
		i.GuildID, userID, earnings)
	if err != nil {
		bot.Reply(s, i, fmt.Sprintf("Failed to record earnings: %v", err))
		return
	}

	bot.Reply(s, i, fmt.Sprintf("💼 You worked a shift and earned **%d** coins!", earnings))
}

func handlePay(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	opts := i.ApplicationCommandData().Options
	target := opts[0].UserValue(s)
	amount := opts[1].IntValue()
	sender := i.Member.User

	if target.ID == sender.ID {
		bot.Reply(s, i, "You can't pay yourself.")
		return
	}

	ctx := context.Background()
	tx, err := b.DB.Pool.Begin(ctx)
	if err != nil {
		bot.Reply(s, i, fmt.Sprintf("Transaction failed to start: %v", err))
		return
	}
	defer tx.Rollback(ctx)

	var senderBalance int64
	err = tx.QueryRow(ctx,
		`SELECT balance FROM economy_accounts WHERE guild_id=$1 AND user_id=$2`,
		i.GuildID, sender.ID).Scan(&senderBalance)
	if err != nil && err != pgx.ErrNoRows {
		bot.Reply(s, i, fmt.Sprintf("Failed to check balance: %v", err))
		return
	}
	if senderBalance < amount {
		bot.Reply(s, i, "You don't have enough coins.")
		return
	}

	if _, err := tx.Exec(ctx,
		`UPDATE economy_accounts SET balance = balance - $1 WHERE guild_id=$2 AND user_id=$3`,
		amount, i.GuildID, sender.ID); err != nil {
		bot.Reply(s, i, fmt.Sprintf("Payment failed: %v", err))
		return
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO economy_accounts (guild_id, user_id, balance) VALUES ($1, $2, $3)
		 ON CONFLICT (guild_id, user_id) DO UPDATE SET balance = economy_accounts.balance + $3`,
		i.GuildID, target.ID, amount); err != nil {
		bot.Reply(s, i, fmt.Sprintf("Payment failed: %v", err))
		return
	}
	if err := tx.Commit(ctx); err != nil {
		bot.Reply(s, i, fmt.Sprintf("Payment failed to commit: %v", err))
		return
	}

	bot.Reply(s, i, fmt.Sprintf("✅ Sent **%d** coins to **%s**.", amount, target.Username))
}

func handleGamble(b *bot.Bot, s *discordgo.Session, i *discordgo.InteractionCreate) {
	amount := i.ApplicationCommandData().Options[0].IntValue()
	userID := i.Member.User.ID

	acc, err := getOrCreateAccount(b, i.GuildID, userID)
	if err != nil {
		bot.Reply(s, i, fmt.Sprintf("Something went wrong: %v", err))
		return
	}
	if acc.Balance < amount {
		bot.Reply(s, i, "You don't have enough coins to bet that much.")
		return
	}

	win := rand.Intn(2) == 0
	delta := amount
	if !win {
		delta = -amount
	}

	_, err = b.DB.Pool.Exec(context.Background(),
		`UPDATE economy_accounts SET balance = balance + $1 WHERE guild_id=$2 AND user_id=$3`,
		delta, i.GuildID, userID)
	if err != nil {
		bot.Reply(s, i, fmt.Sprintf("Failed to settle bet: %v", err))
		return
	}

	if win {
		bot.Reply(s, i, fmt.Sprintf("🎉 You won! +**%d** coins.", amount))
	} else {
		bot.Reply(s, i, fmt.Sprintf("💸 You lost. -**%d** coins.", amount))
	}
}

type account struct {
	Balance int64
	Bank    int64
}

func getOrCreateAccount(b *bot.Bot, guildID, userID string) (*account, error) {
	ctx := context.Background()
	var a account
	err := b.DB.Pool.QueryRow(ctx,
		`SELECT balance, bank FROM economy_accounts WHERE guild_id=$1 AND user_id=$2`,
		guildID, userID).Scan(&a.Balance, &a.Bank)
	if err == pgx.ErrNoRows {
		_, err = b.DB.Pool.Exec(ctx,
			`INSERT INTO economy_accounts (guild_id, user_id) VALUES ($1, $2)`,
			guildID, userID)
		return &account{}, err
	}
	return &a, err
}

func floatPtr(f float64) *float64 { return &f }
