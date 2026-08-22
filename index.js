require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildInvites,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.commands = new Collection();

// ---- Load Commands (recursively from /commands) ----
const commandsPath = path.join(__dirname, 'commands');
function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data?.name) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`[WARN] Command file ${fullPath} is missing "data" or "data.name".`);
      }
    }
  }
}
loadCommands(commandsPath);

// ---- Load Events (from /events) ----
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN পাওয়া যায়নি! Railway Variables ট্যাবে DISCORD_TOKEN সেট করো এবং redeploy করো।');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('❌ Login ব্যর্থ হয়েছে:', err.message);
  if (err.message.includes('disallowed intents')) {
    console.error(
      '👉 Discord Developer Portal > Bot ট্যাবে গিয়ে "SERVER MEMBERS INTENT" এবং "MESSAGE CONTENT INTENT" অন করো, তারপর আবার deploy করো।',
    );
  } else if (err.message.toLowerCase().includes('token')) {
    console.error('👉 DISCORD_TOKEN ভুল বা expired। Developer Portal থেকে টোকেন Reset করে Railway Variables এ আপডেট করো।');
  }
  process.exit(1);
});

client.on('error', (err) => console.error('Client error:', err));
client.on('warn', (msg) => console.warn('Client warning:', msg));
client.on('shardError', (err) => console.error('Shard error:', err));
client.on('shardDisconnect', () => console.warn('⚠️ বট Discord থেকে disconnect হয়ে গেছে, reconnect চেষ্টা করছে...'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});
