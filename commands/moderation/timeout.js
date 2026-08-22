const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('একজন মেম্বারকে নির্দিষ্ট সময়ের জন্য mute (timeout) করো')
    .addUserOption((opt) => opt.setName('user').setDescription('যাকে mute করবে').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('minutes').setDescription('কত মিনিটের জন্য (max 40320 = 28 দিন)').setRequired(true).setMinValue(1).setMaxValue(40320),
    )
    .addStringOption((opt) => opt.setName('reason').setDescription('কারণ').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'কোনো কারণ উল্লেখ করা হয়নি';
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: '❌ এই ইউজারকে সার্ভারে পাওয়া যায়নি।', ephemeral: true });
    }
    if (!member.moderatable) {
      return interaction.reply({ content: '❌ আমি এই ইউজারকে timeout করতে পারবো না (role hierarchy চেক করো)।', ephemeral: true });
    }

    await member.timeout(minutes * 60 * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🔇 Member Timed Out')
      .addFields(
        { name: 'User', value: `${target.tag} (${target.id})` },
        { name: 'Duration', value: `${minutes} মিনিট` },
        { name: 'Moderator', value: `${interaction.user.tag}` },
        { name: 'Reason', value: reason },
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
