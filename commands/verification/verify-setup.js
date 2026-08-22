const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { setGuildConfig } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify-setup')
    .setDescription('Verification panel সেটআপ করো')
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('যেখানে verification panel পাঠানো হবে')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addRoleOption((opt) => opt.setName('role').setDescription('Verify হলে যে role দেওয়া হবে').setRequired(true))
    .addStringOption((opt) => opt.setName('message').setDescription('Custom message (optional)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const customMsg = interaction.options.getString('message');

    setGuildConfig(interaction.guild.id, { verifyRoleId: role.id });

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ Server Verification')
      .setDescription(
        customMsg ||
          `স্বাগতম **${interaction.guild.name}** এ!\n\nনিচের **Verify** বাটনে ক্লিক করে verify করো এবং সার্ভারের সব চ্যানেল আনলক করো।`,
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_me').setLabel('Verify').setStyle(ButtonStyle.Success).setEmoji('✅'),
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: `✅ Verification panel পাঠানো হয়েছে ${channel} এ।`, ephemeral: true });
  },
};
