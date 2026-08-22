# Nostang Bot

Discord.js v14 দিয়ে বানানো একটা কাস্টম বট — **Moderation, Verification, Ticket System, Autorole, Embed Builder**। Music/Economy/Leveling নাই (তোমার চাহিদা অনুযায়ী বাদ দেওয়া হয়েছে)।

## 📋 Commands

| Category | Command | কাজ |
|---|---|---|
| Moderation | `/kick` | মেম্বার kick করা |
| Moderation | `/ban` | মেম্বার ban করা |
| Moderation | `/unban` | User ID দিয়ে unban করা |
| Moderation | `/timeout` | নির্দিষ্ট সময়ের জন্য mute করা |
| Moderation | `/warn` | মেম্বারকে warning দেওয়া |
| Moderation | `/clear` | বাল্ক মেসেজ ডিলিট |
| Verification | `/verify-setup` | Verify panel পাঠানো (বাটনে ক্লিক করলে role পাবে) |
| Ticket | `/ticket-setup` | Ticket panel সেটআপ (বাটনে ক্লিক করলে প্রাইভেট চ্যানেল খুলবে) |
| Ticket | `/ticket-close` | চালু ticket ম্যানুয়ালি বন্ধ করা |
| Utility | `/autorole set/remove/status` | নতুন মেম্বার জয়েন করলে অটো-রোল |
| Utility | `/embed-builder` | Modal দিয়ে কাস্টম embed বানানো ও পাঠানো |
| Utility | `/help` | সব কমান্ড দেখা |
| Welcome/Leave | `/welcome-setup` | নতুন মেম্বার জয়েন করলে welcome message (কে ইনভাইট করেছে সহ) |
| Welcome/Leave | `/leave-setup` | মেম্বার সার্ভার ছেড়ে গেলে leave message |

### 👋 Welcome message placeholders
`/welcome-setup` এ কাস্টম মেসেজ দিলে এগুলো ব্যবহার করতে পারবে:
`{user}` (mention), `{username}`, `{server}`, `{membercount}`, `{inviter}` (কে ইনভাইট করেছে)

### 😢 Leave message placeholders
`{user}`, `{username}`, `{server}`, `{membercount}`

⚠️ **কে ইনভাইট করেছে** সেটা সঠিকভাবে বলতে বটের **"Manage Server"** পারমিশন লাগবে (invite list পড়ার জন্য)। এই permission না থাকলে "শনাক্ত করা যায়নি" দেখাবে।

## ⚙️ Local Setup

```bash
npm install
cp .env.example .env
# .env ফাইলে TOKEN, CLIENT_ID (এবং টেস্টের জন্য GUILD_ID) বসাও
npm run deploy   # স্ল্যাশ কমান্ড রেজিস্টার করবে
npm start        # বট চালু হবে
```

## 🔑 Discord Developer Portal থেকে যা লাগবে

1. https://discord.com/developers/applications এ গিয়ে নতুন Application বানাও (নাম: Nostang)।
2. **Bot** ট্যাবে গিয়ে বট তৈরি করে **Token** কপি করো → এটাই `DISCORD_TOKEN`।
3. একই পেজে নিচের দিকে **Privileged Gateway Intents** থেকে অন করো:
   - `SERVER MEMBERS INTENT` ✅ (autorole/verification এর জন্য দরকার)
   - `MESSAGE CONTENT INTENT` ✅
4. **General Information** ট্যাব থেকে **Application ID** কপি করো → এটাই `CLIENT_ID`।
5. **OAuth2 → URL Generator** এ গিয়ে scope: `bot`, `applications.commands` সিলেক্ট করো, এবং প্রয়োজনীয় permissions (Administrator দিলে সহজ হয়, বা নিচেরগুলো: Manage Roles, Kick Members, Ban Members, Moderate Members, Manage Channels, Manage Messages, Manage Server (invite tracking এর জন্য), Send Messages, Embed Links) সিলেক্ট করে জেনারেটেড লিংক দিয়ে বটকে সার্ভারে ইনভাইট করো।

## 🩺 বট Offline দেখাচ্ছে বা কমান্ড কাজ করছে না?

এই ধাপগুলো একে একে চেক করো:

1. **Privileged Intents অন আছে কিনা** — Developer Portal > তোমার App > **Bot** ট্যাব > নিচের দিকে **Privileged Gateway Intents** সেকশনে `SERVER MEMBERS INTENT` আর `MESSAGE CONTENT INTENT` দুইটাই ✅ অন থাকতে হবে। অন না থাকলে বট লগইনই করতে পারবে না (offline দেখাবে) — এটাই সবচেয়ে কমন কারণ।
2. **Railway Logs চেক করো** — Railway প্রজেক্ট > **Deployments** > সর্বশেষ deployment > **View Logs**। এখানে যদি `❌ Login ব্যর্থ হয়েছে` বা `disallowed intents` লেখা দেখো, তাহলে ১ নাম্বার ধাপ ঠিক করো।
3. **DISCORD_TOKEN ঠিক আছে কিনা** — Variables ট্যাবে টোকেনে এক্সট্রা স্পেস/নতুন লাইন নেই তো? টোকেন reset করলে পুরোনোটা কাজ করবে না, নতুনটা বসাতে হবে।
4. **বটের role permission** — সার্ভারে বটের role এ অন্তত Send Messages, View Channel, ও প্রাসঙ্গিক moderation permission গুলো আছে কিনা, এবং বটের role সার্ভারের উপরের দিকে (অন্তত যেসব role manage করবে তার উপরে) আছে কিনা চেক করো।
5. **স্ল্যাশ কমান্ড রেজিস্টার করা হয়েছে কিনা** — `npm run deploy` একবারও না চালালে Discord এ কমান্ড দেখাবেই না। GUILD_ID দিয়ে রেজিস্টার করলে সাথে সাথে দেখাবে, GUILD_ID ছাড়া (global) সব সার্ভারে দেখাতে ১ ঘণ্টা পর্যন্ত সময় লাগতে পারে।
6. Fix করার পর Railway তে **Redeploy** করো, লগে `✅ Logged in as ...` লেখা আসলে বুঝবে বট ঠিকমতো চালু হয়েছে।

⚠️ বটের role টা অবশ্যই সার্ভারের অন্য সব role (যেগুলো ম্যানেজ করবে, যেমন autorole বা mute role) থেকে উপরে রাখতে হবে।

## 🚂 Railway তে Deploy করা

1. এই zip ফাইলের কনটেন্টগুলো একটা GitHub repo তে push করো (অথবা Railway CLI দিয়ে সরাসরি ফোল্ডার থেকে deploy করো)।
2. https://railway.app এ গিয়ে **New Project → Deploy from GitHub repo** সিলেক্ট করো, এই repo বেছে নাও।
3. Railway প্রজেক্টের **Variables** ট্যাবে গিয়ে নিচের variable গুলো যোগ করো:

   | Variable | মান |
   |---|---|
   | `DISCORD_TOKEN` | তোমার বটের টোকেন |
   | `CLIENT_ID` | তোমার Application ID |
   | `GUILD_ID` | (ঐচ্ছিক) টেস্ট সার্ভারের ID — খালি রাখলে গ্লোবাল কমান্ড রেজিস্টার হবে |
   | `BOT_STATUS` | (ঐচ্ছিক) বটের status টেক্সট |

4. Railway অটোমেটিক্যালি `npm install` করে `node index.js` দিয়ে বট চালু করবে (`railway.json` / `Procfile` এ কনফিগার করা আছে)।
5. স্ল্যাশ কমান্ড রেজিস্টার করার জন্য একবার লোকালি বা Railway এর **Shell/Run Command** থেকে চালাও:
   ```bash
   npm run deploy
   ```
   (অথবা লোকাল মেশিন থেকে `.env` সেট করে `npm run deploy` চালিয়ে নাও — একবার রেজিস্টার করলেই হবে, প্রতিবার deploy তে দরকার নাই)।

## 📁 প্রজেক্ট স্ট্রাকচার

```
nostang-bot/
├── index.js                 # বট এন্ট্রি পয়েন্ট
├── deploy-commands.js        # স্ল্যাশ কমান্ড রেজিস্টার করার স্ক্রিপ্ট
├── package.json
├── .env.example
├── Procfile
├── railway.json
├── commands/
│   ├── moderation/           # kick, ban, unban, timeout, warn, clear
│   ├── verification/         # verify-setup
│   ├── ticket/                # ticket-setup, ticket-close
│   └── utility/               # autorole, embed-builder, help
├── events/
│   ├── ready.js
│   ├── interactionCreate.js  # সব বাটন/মোডাল/স্ল্যাশ কমান্ড হ্যান্ডেল করে
│   ├── guildMemberAdd.js     # autorole + welcome message + inviter detect
│   ├── guildMemberRemove.js  # leave message
│   ├── guildCreate.js         # নতুন সার্ভারে invite cache করে
│   ├── inviteCreate.js        # invite cache আপডেট রাখে
│   └── inviteDelete.js        # invite cache আপডেট রাখে
└── utils/
    ├── db.js                  # সিম্পল JSON কনফিগ স্টোরেজ
    ├── tickets.js              # ticket তৈরি/বন্ধ করার লজিক
    └── invites.js              # কে ইনভাইট করেছে সেটা ট্র্যাক করার লজিক
```

## 💾 ডেটা স্টোরেজ

সার্ভার সেটিংস (`verifyRoleId`, `ticketCategoryId`, `autoroleId` ইত্যাদি) `data/config.json` ফাইলে JSON আকারে সেভ হয়। ছোট/মাঝারি সার্ভারের জন্য এটা যথেষ্ট। 

⚠️ Railway এর ফাইল সিস্টেম **ephemeral** — অর্থাৎ প্রতিবার redeploy করলে `data/config.json` রিসেট হয়ে যেতে পারে। যদি সেটিংস স্থায়ীভাবে রাখতে চাও, ভবিষ্যতে Railway এর **Volume** যোগ করে `data/` ফোল্ডারটা mount করে নিতে পারো, অথবা একটা ডাটাবেস (যেমন Railway PostgreSQL/Redis) ব্যবহার করতে পারো।

## 🛠️ কাস্টমাইজেশন

- নতুন কমান্ড যোগ করতে চাইলে `commands/` এর ভিতরে যেকোনো সাব-ফোল্ডারে নতুন `.js` ফাইল বানাও — বট অটোমেটিক্যালি লোড করে নেবে। এরপর `npm run deploy` চালাও।
