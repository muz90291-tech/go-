const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('একজন মেম্বারকে সার্ভার থেকে ban করো')
    .addUserOption((opt) => opt.setName('user').setDescription('যাকে ban করবে').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('কারণ').setRequired(false))
    .addIntegerOption((opt) =>
      opt
        .setName('delete_days')
        .setDescription('গত কতদিনের মেসেজ ডিলিট হবে (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'কোনো কারণ উল্লেখ করা হয়নি';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    const member = interaction.guild.members.cache.get(target.id);

    if (member && !member.bannable) {
      return interaction.reply({ content: '❌ আমি এই ইউজারকে ban করতে পারবো না (role hierarchy চেক করো)।', ephemeral: true });
    }

    await interaction.guild.members.ban(target.id, {
      deleteMessageSeconds: deleteDays * 86400,
      reason,
    });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔨 Member Banned')
      .addFields(
        { name: 'User', value: `${target.tag} (${target.id})` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
