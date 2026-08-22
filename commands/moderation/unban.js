const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('একজন ইউজারকে unban করো (User ID দিয়ে)')
    .addStringOption((opt) => opt.setName('userid').setDescription('ইউজারের ID').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('কারণ').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('userid').trim();
    const reason = interaction.options.getString('reason') || 'কোনো কারণ উল্লেখ করা হয়নি';

    try {
      await interaction.guild.members.unban(userId, reason);
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('✅ Member Unbanned')
        .addFields(
          { name: 'User ID', value: userId },
          { name: 'Moderator', value: `${interaction.user.tag}` },
          { name: 'Reason', value: reason },
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({
        content: '❌ Unban ব্যর্থ হয়েছে। সঠিক User ID দিয়েছো কিনা চেক করো, বা ইউজারটি ban লিস্টে আছে কিনা দেখো।',
        ephemeral: true,
      });
    }
  },
};
