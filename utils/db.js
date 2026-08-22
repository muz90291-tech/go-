const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'config.json');

function ensureFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getGuildConfig(guildId) {
  const all = readAll();
  return all[guildId] || {};
}

function setGuildConfig(guildId, partial) {
  const all = readAll();
  all[guildId] = { ...(all[guildId] || {}), ...partial };
  writeAll(all);
  return all[guildId];
}

function getTicketCount(guildId) {
  const cfg = getGuildConfig(guildId);
  return cfg.ticketCounter || 0;
}

function incrementTicketCount(guildId) {
  const cfg = getGuildConfig(guildId);
  const next = (cfg.ticketCounter || 0) + 1;
  setGuildConfig(guildId, { ticketCounter: next });
  return next;
}

module.exports = {
  getGuildConfig,
  setGuildConfig,
  getTicketCount,
  incrementTicketCount,
};
