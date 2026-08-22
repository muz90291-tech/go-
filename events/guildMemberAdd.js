const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/db');
const { resolveUsedInvite } = require('../utils/invites');

function applyPlaceholders(text, data) {
  return text
    .replaceAll('{user}', data.user)
    .replaceAll('{username}', data.username)
    .replaceAll('{server}', data.server)
    .replaceAll('{membercount}', data.membercount)
    .replaceAll('{inviter}', data.inviter);
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    // ---- Autorole ----
    try {
      const config = getGuildConfig(member.guild.id);
      if (config.autoroleId) {
        const role = member.guild.roles.cache.get(config.autoroleId);
        if (role) {
          await member.roles.add(role).catch((err) => {
            console.error(`Autorole assign failed in ${member.guild.name}:`, err.message);
          });
        }
      }
    } catch (err) {
      console.error('Autorole error:', err);
    }

    // ---- Detect who invited this member ----
    let inviterTag = 'শনাক্ত করা যায়নি';
    let inviteCode = null;

    if (member.user.bot) {
      inviterTag = 'Bot (OAuth দিয়ে যোগ হয়েছে)';
    } else {
      try {
        const used = await resolveUsedInvite(member);
        if (used) {
          inviterTag = used.inviter ? used.inviter.tag : 'Unknown (vanity URL)';
          inviteCode = used.code;
        } else {
          inviterTag = 'শনাক্ত করা যায়নি (vanity URL অথবা বট এর "Manage Server" permission নেই)';
        }
      } catch (err) {
        console.error('Invite resolve error:', err);
      }
    }

    // ---- Welcome message ----
    try {
      const config = getGuildConfig(member.guild.id);
      if (!config.welcomeChannelId) return;

      const channel = member.guild.channels.cache.get(config.welcomeChannelId);
      if (!channel) return;

      const template =
        config.welcomeMessage ||
        'স্বাগতম {user}! তোমাকে **{server}** এ পেয়ে ভালো লাগলো। 🎉 (মোট মেম্বার: {membercount})';

      const text = applyPlaceholders(template, {
        user: `${member}`,
        username: member.user.username,
        server: member.guild.name,
        membercount: `${member.guild.memberCount}`,
        inviter: inviterTag,
      });

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setDescription(text)
        .addFields({
          name: '👤 কে ইনভাইট করেছে',
          value: inviterTag + (inviteCode ? ` (invite code: \`${inviteCode}\`)` : ''),
        })
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('Welcome message error:', err);
    }
  },
};
