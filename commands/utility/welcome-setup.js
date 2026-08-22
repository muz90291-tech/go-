const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setGuildConfig } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-setup')
    .setDescription('নতুন মেম্বার জয়েন করলে welcome message সেটআপ করো')
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Welcome message যেখানে পাঠানো হবে')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('message')
        .setDescription('কাস্টম মেসেজ। ব্যবহার করা যাবে: {user} {username} {server} {membercount} {inviter}')
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    const payload = { welcomeChannelId: channel.id };
    if (message) payload.welcomeMessage = message;
    setGuildConfig(interaction.guild.id, payload);

    return interaction.reply({
      content: `✅ Welcome message সেটআপ হয়েছে ${channel} চ্যানেলে।\n\n**Placeholders:** \`{user}\` \`{username}\` \`{server}\` \`{membercount}\` \`{inviter}\`\n\n⚠️ কে ইনভাইট করেছে সেটা সঠিকভাবে দেখাতে বটের **"Manage Server"** পারমিশন লাগবে।`,
      ephemeral: true,
    });
  },
};
