const { cacheGuildInvites } = require('../utils/invites');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    console.log(`➕ নতুন সার্ভারে যোগ হলো: ${guild.name} (${guild.id})`);
    await cacheGuildInvites(guild);
  },
};
