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
    .setName('ticket-setup')
    .setDescription('Ticket system সেটআপ করো')
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('যেখানে ticket panel পাঠানো হবে')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addChannelOption((opt) =>
      opt
        .setName('category')
        .setDescription('Ticket চ্যানেলগুলো যে ক্যাটাগরিতে তৈরি হবে')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true),
    )
    .addRoleOption((opt) => opt.setName('support_role').setDescription('Support/staff role (optional)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const category = interaction.options.getChannel('category');
    const supportRole = interaction.options.getRole('support_role');

    setGuildConfig(interaction.guild.id, {
      ticketCategoryId: category.id,
      ticketSupportRoleId: supportRole ? supportRole.id : null,
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎫 Support Ticket')
      .setDescription('সাহায্য দরকার? নিচের বাটনে ক্লিক করে একটা প্রাইভেট ticket চ্যানেল খোলো।')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('create_ticket').setLabel('Create Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: `✅ Ticket panel পাঠানো হয়েছে ${channel} এ।`, ephemeral: true });
  },
};
