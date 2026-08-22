const { SlashCommandBuilder } = require('discord.js');
const { closeTicket } = require('../../utils/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('বর্তমান ticket চ্যানেলটি বন্ধ করো (শুধু ticket চ্যানেলের ভিতরে কাজ করবে)'),

  async execute(interaction) {
    return closeTicket(interaction);
  },
};
