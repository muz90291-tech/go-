const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('একজন মেম্বারকে warning দাও')
    .addUserOption((opt) => opt.setName('user').setDescription('যাকে warn করবে').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('কারণ').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('⚠️ Member Warned')
      .addFields(
        { name: 'User', value: `${target.tag} (${target.id})` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      )
      .setTimestamp();

    // Try to DM the user
    target.send({ content: `তুমি **${interaction.guild.name}** সার্ভারে একটা warning পেয়েছো।\n**কারণ:** ${reason}` }).catch(() => {});

    return interaction.reply({ embeds: [embed] });
  },
};
