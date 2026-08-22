const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('একজন মেম্বারকে সার্ভার থেকে kick করো')
    .addUserOption((opt) => opt.setName('user').setDescription('যাকে kick করবে').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('কারণ').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'কোনো কারণ উল্লেখ করা হয়নি';
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: '❌ এই ইউজারকে সার্ভারে পাওয়া যায়নি।', ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ content: '❌ আমি এই ইউজারকে kick করতে পারবো না (role hierarchy চেক করো)।', ephemeral: true });
    }

    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('👢 Member Kicked')
      .addFields(
        { name: 'User', value: `${target.tag} (${target.id})` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
