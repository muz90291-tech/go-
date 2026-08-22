const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Nostang bot এর সব কমান্ড দেখো'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🤖 Nostang — Command List')
      .addFields(
        {
          name: '🛡️ Moderation',
          value:
            '`/kick` `/ban` `/unban` `/timeout` `/warn` `/clear`',
        },
        {
          name: '✅ Verification',
          value: '`/verify-setup`',
        },
        {
          name: '🎫 Ticket',
          value: '`/ticket-setup` `/ticket-close`',
        },
        {
          name: '👋 Welcome / Leave',
          value: '`/welcome-setup` `/leave-setup`',
        },
        {
          name: '🧩 Utility',
          value: '`/autorole set|remove|status` `/embed-builder` `/help`',
        },
      )
      .setFooter({ text: 'Nostang Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
