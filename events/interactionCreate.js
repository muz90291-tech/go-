const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../utils/db');
const { createTicket, closeTicket } = require('../utils/tickets');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // ---- Slash Commands ----
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
          await command.execute(interaction);
        } catch (err) {
          console.error(`Error executing /${interaction.commandName}:`, err);
          const payload = {
            content: '❌ কমান্ড চালাতে গিয়ে একটা এরর হয়েছে।',
            ephemeral: true,
          };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(payload).catch(() => {});
          } else {
            await interaction.reply(payload).catch(() => {});
          }
        }
        return;
      }

      // ---- Buttons ----
      if (interaction.isButton()) {
        if (interaction.customId === 'verify_me') {
          const config = getGuildConfig(interaction.guild.id);
          if (!config.verifyRoleId) {
            return interaction.reply({
              content: '❌ Verification system সেটআপ করা নেই।',
              ephemeral: true,
            });
          }
          const role = interaction.guild.roles.cache.get(config.verifyRoleId);
          if (!role) {
            return interaction.reply({
              content: '❌ Verify role খুঁজে পাওয়া যায়নি, এডমিনকে জানাও।',
              ephemeral: true,
            });
          }
          if (interaction.member.roles.cache.has(role.id)) {
            return interaction.reply({
              content: '✅ তুমি আগেই verified!',
              ephemeral: true,
            });
          }
          await interaction.member.roles.add(role);
          return interaction.reply({
            content: '🎉 সফলভাবে verify হয়ে গেছো! সার্ভারে স্বাগতম।',
            ephemeral: true,
          });
        }

        if (interaction.customId === 'create_ticket') {
          return createTicket(interaction);
        }

        if (interaction.customId === 'close_ticket') {
          return closeTicket(interaction);
        }
      }

      // ---- Modals ----
      if (interaction.isModalSubmit()) {
        if (interaction.customId === 'embed_builder_modal') {
          const title = interaction.fields.getTextInputValue('embed_title') || null;
          const description = interaction.fields.getTextInputValue('embed_description') || null;
          const colorInput = interaction.fields.getTextInputValue('embed_color') || '';
          const footer = interaction.fields.getTextInputValue('embed_footer') || null;
          const imageUrl = interaction.fields.getTextInputValue('embed_image') || null;

          const embed = new EmbedBuilder();
          if (title) embed.setTitle(title);
          if (description) embed.setDescription(description);
          if (footer) embed.setFooter({ text: footer });

          let color = 0x5865f2;
          if (/^#?[0-9A-Fa-f]{6}$/.test(colorInput.trim())) {
            color = parseInt(colorInput.trim().replace('#', ''), 16);
          }
          embed.setColor(color);

          if (imageUrl && /^https?:\/\/.+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(imageUrl.trim())) {
            embed.setImage(imageUrl.trim());
          }

          if (!title && !description) {
            return interaction.reply({
              content: '❌ কমপক্ষে একটা title বা description দিতে হবে।',
              ephemeral: true,
            });
          }

          await interaction.channel.send({ embeds: [embed] });
          return interaction.reply({ content: '✅ Embed পাঠানো হয়েছে!', ephemeral: true });
        }
      }
    } catch (err) {
      console.error('interactionCreate error:', err);
    }
  },
};
