const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('চ্যানেল থেকে একসাথে অনেক মেসেজ ডিলিট করো')
    .addIntegerOption((opt) =>
      opt.setName('amount').setDescription('কতগুলো মেসেজ ডিলিট করবে (1-100)').setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    await interaction.deferReply({ ephemeral: true });
    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.editReply({ content: `🧹 ${deleted.size}টা মেসেজ ডিলিট করা হয়েছে।` });
    } catch (err) {
      return interaction.editReply({
        content: '❌ মেসেজ ডিলিট করতে সমস্যা হয়েছে (১৪ দিনের বেশি পুরনো মেসেজ bulk delete করা যায় না)।',
      });
    }
  },
};
