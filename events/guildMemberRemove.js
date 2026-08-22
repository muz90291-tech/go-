const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/db');

function applyPlaceholders(text, data) {
  return text
    .replaceAll('{user}', data.user)
    .replaceAll('{username}', data.username)
    .replaceAll('{server}', data.server)
    .replaceAll('{membercount}', data.membercount);
}

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      const config = getGuildConfig(member.guild.id);
      if (!config.leaveChannelId) return;

      const channel = member.guild.channels.cache.get(config.leaveChannelId);
      if (!channel) return;

      const template = config.leaveMessage || '😢 **{username}** সার্ভার ছেড়ে চলে গেছে। (মোট মেম্বার: {membercount})';

      const text = applyPlaceholders(template, {
        user: `${member.user.tag}`,
        username: member.user.username,
        server: member.guild.name,
        membercount: `${member.guild.memberCount}`,
      });

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setDescription(text)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('Leave message error:', err);
    }
  },
};
