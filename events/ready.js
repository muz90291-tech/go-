const { ActivityType } = require('discord.js');
const { cacheGuildInvites } = require('../utils/invites');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const statusText = process.env.BOT_STATUS || 'Nostang | /help';
    client.user.setPresence({
      activities: [{ name: statusText, type: ActivityType.Watching }],
      status: 'online',
    });

    // Cache invites for every guild so we can detect who invited new members
    for (const guild of client.guilds.cache.values()) {
      await cacheGuildInvites(guild);
    }
    console.log(`📨 ${client.guilds.cache.size}টা সার্ভারের invite cache করা হয়েছে।`);
  },
};
