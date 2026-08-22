const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setGuildConfig } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave-setup')
    .setDescription('মেম্বার সার্ভার ছেড়ে গেলে leave message সেটআপ করো')
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Leave message যেখানে পাঠানো হবে')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('message')
        .setDescription('কাস্টম মেসেজ। ব্যবহার করা যাবে: {user} {username} {server} {membercount}')
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    const payload = { leaveChannelId: channel.id };
    if (message) payload.leaveMessage = message;
    setGuildConfig(interaction.guild.id, payload);

    return interaction.reply({
      content: `✅ Leave message সেটআপ হয়েছে ${channel} চ্যানেলে।\n\n**Placeholders:** \`{user}\` \`{username}\` \`{server}\` \`{membercount}\``,
      ephemeral: true,
    });
  },
};
