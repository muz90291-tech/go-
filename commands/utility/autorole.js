const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('নতুন মেম্বার জয়েন করলে অটোমেটিক role দেওয়ার সিস্টেম')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Autorole সেট করো')
        .addRoleOption((opt) => opt.setName('role').setDescription('যে role দেওয়া হবে').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('remove').setDescription('Autorole বন্ধ করো'))
    .addSubcommand((sub) => sub.setName('status').setDescription('বর্তমান autorole দেখো'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const role = interaction.options.getRole('role');

      if (role.managed || role.id === interaction.guild.id) {
        return interaction.reply({ content: '❌ এই role টা autorole হিসেবে সেট করা যাবে না।', ephemeral: true });
      }
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          content: '❌ আমার highest role এর চেয়ে উঁচুতে বা সমান role autorole হিসেবে সেট করতে পারবো না। আমার role টাকে উপরে নাও।',
          ephemeral: true,
        });
      }

      setGuildConfig(interaction.guild.id, { autoroleId: role.id });
      return interaction.reply({ content: `✅ Autorole সেট করা হয়েছে: ${role}` });
    }

    if (sub === 'remove') {
      setGuildConfig(interaction.guild.id, { autoroleId: null });
      return interaction.reply({ content: '✅ Autorole বন্ধ করা হয়েছে।' });
    }

    if (sub === 'status') {
      const config = getGuildConfig(interaction.guild.id);
      if (!config.autoroleId) {
        return interaction.reply({ content: 'ℹ️ এখন কোনো autorole সেট করা নেই।', ephemeral: true });
      }
      return interaction.reply({ content: `ℹ️ বর্তমান autorole: <@&${config.autoroleId}>`, ephemeral: true });
    }
  },
};
