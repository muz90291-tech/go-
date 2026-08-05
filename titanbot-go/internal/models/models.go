package models

import "time"

// EconomyAccount mirrors a row in economy_accounts.
type EconomyAccount struct {
	GuildID   string
	UserID    string
	Balance   int64
	Bank      int64
	LastWork  *time.Time
	LastDaily *time.Time
}

// ModCase mirrors a row in mod_cases.
type ModCase struct {
	ID          int
	GuildID     string
	UserID      string
	ModeratorID string
	Action      string
	Reason      string
	CreatedAt   time.Time
}

// LevelEntry mirrors a row in levels.
type LevelEntry struct {
	GuildID  string
	UserID   string
	XP       int64
	Level    int
	LastXPAt *time.Time
}

// ShopItem mirrors a row in shop_items.
type ShopItem struct {
	ID          int
	GuildID     string
	Name        string
	Description string
	Price       int64
}
