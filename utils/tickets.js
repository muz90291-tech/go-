const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { getGuildConfig, incrementTicketCount } = require('./db');

async function createTicket(interaction) {
  const config = getGuildConfig(interaction.guild.id);

  if (!config.ticketCategoryId) {
    return interaction.reply({
      content: '❌ Ticket system এখনো সেটআপ করা হয়নি। একজন এডমিনকে `/ticket-setup` চালাতে বলো।',
      ephemeral: true,
    });
  }

  // Prevent duplicate open tickets for the same user
  const existing = interaction.guild.channels.cache.find(
    (ch) => ch.topic === `ticket-owner:${interaction.user.id}`,
  );
  if (existing) {
    return interaction.reply({
      content: `⚠️ তোমার আগে থেকেই একটা খোলা ticket আছে: ${existing}`,
      ephemeral: true,
    });
  }

  const ticketNumber = incrementTicketCount(interaction.guild.id);
  const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

  const permissionOverwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ];

  if (config.ticketSupportRoleId) {
    permissionOverwrites.push({
      id: config.ticketSupportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId,
    topic: `ticket-owner:${interaction.user.id}`,
    permissionOverwrites,
  });

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket #${ticketNumber}`)
    .setDescription(
      `স্বাগতম ${interaction.user}!\nতোমার সমস্যাটা এখানে বিস্তারিত লেখো, খুব শীঘ্রই সাপোর্ট টিম রেসপন্স দিবে।\n\nটিকেট বন্ধ করতে নিচের বাটনে ক্লিক করো।`,
    )
    .setColor(0x5865f2)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
  );

  const mention = config.ticketSupportRoleId ? `<@&${config.ticketSupportRoleId}>` : '';
  await channel.send({ content: `${interaction.user} ${mention}`, embeds: [embed], components: [row] });

  return interaction.reply({
    content: `✅ তোমার ticket তৈরি হয়েছে: ${channel}`,
    ephemeral: true,
  });
}

async function closeTicket(interaction) {
  const channel = interaction.channel;

  if (!channel.topic || !channel.topic.startsWith('ticket-owner:')) {
    return interaction.reply({
      content: '❌ এটা একটা ticket চ্যানেল না।',
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: '🔒 এই ticket ১০ সেকেন্ডের মধ্যে বন্ধ হয়ে যাবে...',
  });

  setTimeout(() => {
    channel.delete().catch((err) => console.error('Ticket delete failed:', err.message));
  }, 10000);
}

module.exports = { createTicket, closeTicket };
